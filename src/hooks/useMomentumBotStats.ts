import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, Timestamp, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabaseClient } from "@/lib/supabaseClient";
import type { Bot, Trade } from "@/types/bot";

interface LiveMetrics {
  cash: number;
  initialCredits: number;
  marketValue: number;
  lastTradeAt?: string;
}

const DEFAULT_INITIAL_CREDITS = 1_000_000;
const STATS_EPSILON = 1e-6;
const MOMENTUM_BOT_ID = "1";
const MOMENTUM_UID = import.meta.env.VITE_BOT_MOMENTUM_UID;
const sanitizeNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number") return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value;
};
const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;

async function fetchLatestPrice(symbol: string): Promise<number | null> {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient
    .from("stock_market_history")
    .select("close_value")
    .eq("symbol", symbol)
    .order("record_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("Supabase price error", error);
    return null;
  }
  const raw = data?.close_value;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) ? value : null;
}

function formatDate(value?: Timestamp | { toDate?: () => Date } | number): string | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return undefined;
}

export function useMomentumBotStats() {
  const [override, setOverride] = useState<Partial<Bot> & { liveMetrics?: LiveMetrics } | null>(null);
  const [loading, setLoading] = useState(Boolean(MOMENTUM_UID));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!MOMENTUM_UID) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userRef = doc(db, "users", MOMENTUM_UID);
        const ordersRef = collection(db, "users", MOMENTUM_UID, "orders");
        const positionsRef = collection(db, "users", MOMENTUM_UID, "positions");
        const [userSnap, ordersSnap, positionsSnap] = await Promise.all([
          getDoc(userRef),
          getDocs(ordersRef),
          getDocs(positionsRef),
        ]);

        const userData = userSnap.data() ?? {};
        const initialCredits =
          typeof userData.initialCredits === "number" && Number.isFinite(userData.initialCredits)
            ? userData.initialCredits
            : DEFAULT_INITIAL_CREDITS;
        const cash =
          typeof userData.cash === "number" && Number.isFinite(userData.cash)
            ? userData.cash
            : initialCredits;

        const normalizedOrders = normalizeOrders(ordersSnap.docs);
        const lastTradeAt =
          normalizedOrders.length > 0
            ? new Date(Math.max(...normalizedOrders.map((order) => order.ts))).toISOString()
            : undefined;

        const openTrades: Trade[] = [];
        let marketValue = 0;
        for (const position of positionsSnap.docs) {
          const data = position.data() as any;
          const qty = Number(data?.qty ?? 0);
          if (!Number.isFinite(qty) || Math.abs(qty) <= 1e-6) continue;
          const symbol = typeof data?.symbol === "string" ? data.symbol : position.id;
          const avgPrice = Number(data?.avgPrice ?? data?.price ?? 0) || 0;
          const currentPrice = await fetchLatestPrice(symbol);
          const currentValue = currentPrice ? currentPrice * qty : 0;
          marketValue += currentValue;
          const pnl = currentPrice ? (currentPrice - avgPrice) * qty : 0;
          const purchaseDate = formatDate(data?.updatedAt) ?? new Date().toISOString();
          openTrades.push({
            id: `${symbol}-open`,
            company: symbol,
            logo: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
            quantity: qty,
            purchasePrice: avgPrice,
            purchaseValue: avgPrice * qty,
            currentPrice: currentPrice ?? undefined,
            currentValue: currentPrice ? currentValue : undefined,
            pnl,
            purchaseDate,
          });
        }

        const totalValue = cash + marketValue;
        const stats = computeBotStats(initialCredits, totalValue, normalizedOrders);
        const totalPnL = stats.pnl;
        const roi = stats.roi * 100;
        const trades = stats.tradesCount;
        const winRate = stats.winRate * 100;
        const status: Bot["status"] =
          lastTradeAt && Date.now() - new Date(lastTradeAt).getTime() < 1000 * 60 * 60 * 24 * 3
            ? "active"
            : trades > 0
            ? "paused"
            : "stopped";

        const overrides: Partial<Bot> & { liveMetrics: LiveMetrics } = {
          id: MOMENTUM_BOT_ID,
          roi,
          totalPnL,
          trades,
          winRate,
          status,
          ...(openTrades.length ? { openTrades } : {}),
          liveMetrics: { cash, initialCredits, marketValue, lastTradeAt },
        };

        if (!cancelled) {
          setOverride(overrides);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to fetch bot stats", err);
        if (!cancelled) {
          setError(err?.message ?? "Unknown error");
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { data: override, loading, error };
}

type NormalizedOrder = {
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  fillPrice: number;
  ts: number;
};

function normalizeOrders(docs: QueryDocumentSnapshot[]): NormalizedOrder[] {
  return docs
    .map((order) => {
      const data = order.data() as Record<string, unknown>;
      const symbolRaw = typeof data?.symbol === "string" ? data.symbol : order.id;
      const sideRaw = typeof data?.side === "string" ? data.side.toLowerCase() : "";
      const qty = sanitizeNumber(data?.qty);
      const fillPrice = sanitizeNumber((data as any)?.fillPrice);
      const tsValue = data?.ts;
      let ts = Date.now();
      if (typeof tsValue === "number" && Number.isFinite(tsValue)) {
        ts = tsValue;
      } else if (tsValue instanceof Timestamp) {
        ts = tsValue.toMillis();
      } else if (tsValue instanceof Date) {
        ts = tsValue.getTime();
      }
      if (!symbolRaw || (sideRaw !== "buy" && sideRaw !== "sell")) return null;
      if (typeof qty !== "number" || typeof fillPrice !== "number") return null;
      if (qty <= STATS_EPSILON || fillPrice <= STATS_EPSILON) return null;
      return { symbol: symbolRaw, side: sideRaw as "buy" | "sell", qty, fillPrice, ts };
    })
    .filter((entry): entry is NormalizedOrder => Boolean(entry))
    .sort((a, b) => a.ts - b.ts);
}

function computeBotStats(
  initialCredits: number,
  totalValue: number,
  orders: NormalizedOrder[],
) {
  const tradesCount = orders.length;
  const pnl = round6(totalValue - initialCredits);
  const roi = initialCredits > STATS_EPSILON ? (totalValue - initialCredits) / initialCredits : 0;

  const fifoBooks = new Map<string, Array<{ qty: number; price: number }>>();
  let realizedPnl = 0;
  let wins = 0;
  let losses = 0;
  let closedTrades = 0;

  for (const order of orders) {
    if (!fifoBooks.has(order.symbol)) {
      fifoBooks.set(order.symbol, []);
    }
    const book = fifoBooks.get(order.symbol)!;
    if (order.side === "buy") {
      book.push({ qty: order.qty, price: order.fillPrice });
      continue;
    }
    let remaining = order.qty;
    let orderPnl = 0;
    while (remaining > STATS_EPSILON && book.length) {
      const lot = book[0];
      const consume = Math.min(lot.qty, remaining);
      orderPnl += (order.fillPrice - lot.price) * consume;
      lot.qty -= consume;
      remaining -= consume;
      if (lot.qty <= STATS_EPSILON) {
        book.shift();
      }
    }
    if (remaining <= STATS_EPSILON) {
      realizedPnl += orderPnl;
      closedTrades += 1;
      if (orderPnl > STATS_EPSILON) {
        wins += 1;
      } else if (orderPnl < -STATS_EPSILON) {
        losses += 1;
      }
    }
  }

  const winRate = closedTrades > 0 ? wins / closedTrades : 0;

  return {
    tradesCount,
    pnl,
    roi,
    realizedPnl: round6(realizedPnl),
    wins,
    losses,
    winRate,
    closedTrades,
  };
}
