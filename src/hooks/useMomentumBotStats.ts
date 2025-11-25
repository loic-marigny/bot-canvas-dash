import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
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
const MOMENTUM_BOT_ID = "1";
const MOMENTUM_UID = import.meta.env.VITE_BOT_MOMENTUM_UID;

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

        const tradeDates = ordersSnap.docs
          .map((order) => {
            const data = order.data() as any;
            return data?.ts instanceof Timestamp ? data.ts.toDate().getTime() : undefined;
          })
          .filter((value): value is number => typeof value === "number");
        const lastTradeAt = tradeDates.length ? new Date(Math.max(...tradeDates)).toISOString() : undefined;

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
        const totalPnL = totalValue - initialCredits;
        const roi = initialCredits ? (totalPnL / initialCredits) * 100 : 0;
        const trades = ordersSnap.size;
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
