import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: false });

import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  serverTimestamp,
  type DocumentReference,
  type DocumentSnapshot,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { createClient } from "@supabase/supabase-js";

type SpotSide = "buy" | "sell";

interface SpotOrderParams {
  uid: string;
  symbol: string;
  side: SpotSide;
  qty: number;
  fillPrice: number;
  type?: string;
  lotTimestamp?: number;
  extra?: Record<string, unknown>;
}

const FIFO_EPSILON = 1e-9;
const DEFAULT_INITIAL_CASH = 1_000_000;

type FifoLotDoc = {
  qty: number;
  price: number;
  ts: number;
};

const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;

const sanitizeNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number") return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value;
};

const normalizeFifoLots = (raw: unknown): FifoLotDoc[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return undefined;
      const qty = sanitizeNumber((entry as any).qty);
      const price = sanitizeNumber((entry as any).price);
      const tsCandidate = (entry as any).ts;
      const ts =
        typeof tsCandidate === "number" && Number.isFinite(tsCandidate) ? tsCandidate : 0;
      if (typeof qty !== "number" || typeof price !== "number") return undefined;
      if (qty <= FIFO_EPSILON) return undefined;
      return { qty, price, ts };
    })
    .filter((lot): lot is FifoLotDoc => Boolean(lot))
    .sort((a, b) => a.ts - b.ts);
};

const computeCashAfterDelta = (
  snapshot: DocumentSnapshot | null,
  delta: number,
  fallbackInitial = DEFAULT_INITIAL_CASH,
): number => {
  const data = snapshot?.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const base =
    sanitizeNumber(data?.cash) ??
    sanitizeNumber(data?.initialCredits) ??
    fallbackInitial;
  return round6(base + delta);
};

const computeFifoPositionPayload = (
  snapshot: DocumentSnapshot | null,
  symbol: string,
  side: SpotSide,
  qty: number,
  price: number,
  ts: number,
) => {
  const data = snapshot?.exists() ? (snapshot.data() as Record<string, unknown>) : {};
  const currentLots = normalizeFifoLots((data as any).lots);
  let nextLots: FifoLotDoc[];

  if (side === "buy") {
    nextLots = [...currentLots, { qty: round6(qty), price, ts }];
  } else {
    let remaining = qty;
    const updated: FifoLotDoc[] = [];
    for (const lot of currentLots) {
      if (remaining <= FIFO_EPSILON) {
        updated.push(lot);
        continue;
      }
      const consume = Math.min(lot.qty, remaining);
      const leftover = lot.qty - consume;
      remaining -= consume;
      if (leftover > FIFO_EPSILON) {
        updated.push({ ...lot, qty: round6(leftover) });
      }
    }
    if (remaining > FIFO_EPSILON) {
      throw new Error("Insufficient FIFO lots to settle sell order.");
    }
    nextLots = updated;
  }

  nextLots = nextLots
    .filter((lot) => lot.qty > FIFO_EPSILON)
    .map((lot) => ({ ...lot, qty: round6(lot.qty), price: round6(lot.price) }))
    .sort((a, b) => a.ts - b.ts);

  const totalQty = nextLots.reduce((acc, lot) => acc + lot.qty, 0);
  const totalCost = nextLots.reduce((acc, lot) => acc + lot.qty * lot.price, 0);
  const avgPrice = totalQty > FIFO_EPSILON ? round6(totalCost / totalQty) : 0;

  return {
    symbol,
    qty: round6(totalQty),
    avgPrice,
    lots: nextLots,
    updatedAt: ts,
  };
};

async function submitSpotOrder(db: ReturnType<typeof getFirestore>, params: SpotOrderParams): Promise<void> {
  const {
    uid,
    symbol,
    side,
    qty,
    fillPrice,
    type = "MARKET",
    lotTimestamp = Date.now(),
    extra,
  } = params;

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Quantity must be positive.");
  }
  if (!Number.isFinite(fillPrice) || fillPrice <= 0) {
    throw new Error("Price must be positive.");
  }

  const ordRef = doc(collection(db, "users", uid, "orders"));
  const userRef: DocumentReference = doc(db, "users", uid);
  const positionRef: DocumentReference = doc(db, "users", uid, "positions", symbol);
  const cashDelta = (side === "buy" ? -1 : 1) * qty * fillPrice;

  await runTransaction(db, async (tx) => {
    const [userSnap, positionSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(positionRef),
    ]);

    const nextCash = computeCashAfterDelta(userSnap, cashDelta);
    const positionPayload = computeFifoPositionPayload(positionSnap, symbol, side, qty, fillPrice, lotTimestamp);

    tx.set(userRef, { cash: nextCash }, { merge: true });
    tx.set(positionRef, positionPayload, { merge: true });
    tx.set(ordRef, {
      symbol,
      side,
      qty,
      type,
      status: "filled",
      fillPrice,
      ts: serverTimestamp(),
      ...(extra ?? {}),
    });
  });
}

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable ${key}`);
  return value;
}

async function main() {
  const firebaseConfig = {
    apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requiredEnv("VITE_FIREBASE_APP_ID"),
  };

  const supabaseUrl = requiredEnv("VITE_SUPABASE_URL");
  const supabaseAnonKey = requiredEnv("VITE_SUPABASE_ANON_KEY");

  const botEmail = requiredEnv("BOT_MOMENTUM_EMAIL");
  const botPassword = requiredEnv("BOT_MOMENTUM_PASSWORD");

  const symbol = process.env.BOT_MOMENTUM_SYMBOL ?? "AAPL";
  const lotSize = Number(process.env.BOT_MOMENTUM_QTY ?? "1");

  console.log(`[Momentum Bot] Target symbol: ${symbol}, Lot size: ${lotSize}`);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const cred = await signInWithEmailAndPassword(auth, botEmail, botPassword);
  const uid = cred.user.uid;
  console.log(`[Momentum Bot] Authenticated as UID ${uid}`);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("stock_market_history")
    .select("record_date, close_value")
    .eq("symbol", symbol)
    .order("record_date", { ascending: false })
    .limit(2);

  if (error) throw error;
  if (!data || data.length < 2) {
    console.log("[Momentum Bot] Not enough historical data, exiting.");
    return;
  }

  const latest = Number(data[0].close_value ?? 0);
  const previous = Number(data[1].close_value ?? 0);
  if (!Number.isFinite(latest) || !Number.isFinite(previous)) {
    console.log("[Momentum Bot] Invalid price data, skipping.");
    return;
  }

  const db = getFirestore(app);
  const userRef = doc(db, "users", uid);
  const positionRef = doc(db, "users", uid, "positions", symbol);
  const [userSnap, positionSnap] = await Promise.all([getDoc(userRef), getDoc(positionRef)]);
  const cash = sanitizeNumber(userSnap.exists() ? (userSnap.data() as any).cash : undefined) ?? DEFAULT_INITIAL_CASH;
  const qtyHeld = sanitizeNumber(positionSnap.exists() ? (positionSnap.data() as any).qty : undefined) ?? 0;

  console.log(`[Momentum Bot] Latest=${latest}, Previous=${previous}, Cash=${cash}, Qty=${qtyHeld}`);

  if (latest > previous * 1.001 && cash >= latest * lotSize) {
    console.log("[Momentum Bot] Detected upward momentum -> buying.");
    await submitSpotOrder(db, {
      uid,
      symbol,
      side: "buy",
      qty: lotSize,
      fillPrice: latest,
    });
  } else if (latest < previous * 0.999 && qtyHeld >= lotSize) {
    console.log("[Momentum Bot] Detected downward momentum -> selling.");
    await submitSpotOrder(db, {
      uid,
      symbol,
      side: "sell",
      qty: lotSize,
      fillPrice: latest,
    });
  } else {
    console.log("[Momentum Bot] No action triggered.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
