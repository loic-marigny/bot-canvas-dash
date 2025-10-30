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
  performanceData: PerformancePoint[];
}

export interface PerformancePoint {
  date: string;
  liquidity: number;
  positionValue: number;
}
