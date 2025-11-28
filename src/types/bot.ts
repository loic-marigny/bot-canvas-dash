export interface Trade {
  id: string;
  company: string;
  logo: string;
  quantity: number;
  purchasePrice: number;
  purchaseValue: number;
  currentPrice?: number;
  currentValue?: number;
  sellPrice?: number;
  sellValue?: number;
  pnl: number;
  purchaseDate: string;
  sellDate?: string;
}

export interface BotActivationEvent {
  timestamp: string;
  action: "activated" | "deactivated";
  reason?: string;
  actor?: string;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  code: string;
  strategy: string;
  roi: number;
  totalPnL: number;
  winRate: number;
  trades: number;
  status: "active" | "paused" | "stopped";
  startDate: string;
  performanceData: PerformancePoint[];
  openTrades: Trade[];
  closedTrades: Trade[];
  firestoreUid?: string;
  liveMetrics?: {
    cash: number;
    initialCredits: number;
    marketValue: number;
    lastTradeAt?: string;
  };
  activationHistory: BotActivationEvent[];
}

export interface PerformancePoint {
  date: string;
  liquidity: number;
  positionValue: number;
}
