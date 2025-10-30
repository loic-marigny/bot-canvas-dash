import { Bot } from "@/types/bot";

export const mockBots: Bot[] = [
  {
    id: "1",
    name: "Momentum Scalper",
    description: "Bot de scalping rapide basé sur le momentum et les indicateurs de volume",
    code: `def momentum_strategy(data):
    # RSI calculation
    rsi = calculate_rsi(data, period=14)
    
    # Volume analysis
    volume_ma = data['volume'].rolling(20).mean()
    
    # Entry conditions
    if rsi < 30 and data['volume'] > volume_ma * 1.5:
        return 'BUY'
    elif rsi > 70:
        return 'SELL'
    
    return 'HOLD'`,
    strategy: "Stratégie de scalping basée sur l'indice RSI et l'analyse du volume. Entre en position lorsque le RSI est en zone de survente (< 30) avec un volume anormalement élevé. Sort de position quand le RSI atteint la zone de surachat (> 70).",
    roi: 23.5,
    totalPnL: 14520,
    winRate: 67.3,
    trades: 1247,
    status: "active",
    performanceData: [
      { date: "2024-01", liquidity: 50000, positionValue: 0 },
      { date: "2024-02", liquidity: 48000, positionValue: 3200 },
      { date: "2024-03", liquidity: 45000, positionValue: 8500 },
      { date: "2024-04", liquidity: 42000, positionValue: 12300 },
      { date: "2024-05", liquidity: 38000, positionValue: 18700 },
      { date: "2024-06", liquidity: 35000, positionValue: 24200 },
      { date: "2024-07", liquidity: 32000, positionValue: 29800 },
      { date: "2024-08", liquidity: 30000, positionValue: 34520 },
    ],
  },
  {
    id: "2",
    name: "Mean Reversion Pro",
    description: "Exploite les retours à la moyenne sur les paires majeures",
    code: `def mean_reversion(data):
    # Bollinger Bands
    bb_upper, bb_middle, bb_lower = calculate_bb(data, period=20, std=2)
    
    # Z-score
    z_score = (data['close'] - bb_middle) / (bb_upper - bb_middle)
    
    # Entry/Exit logic
    if z_score < -1.5:
        return 'BUY'
    elif z_score > 1.5:
        return 'SELL'
    
    return 'HOLD'`,
    strategy: "Utilise les bandes de Bollinger et le z-score pour identifier les conditions de surachat/survente. Achète quand le prix est à 1.5 écart-type sous la moyenne, vend quand il est à 1.5 écart-type au-dessus.",
    roi: 18.2,
    totalPnL: 9180,
    winRate: 72.8,
    trades: 843,
    status: "active",
    performanceData: [
      { date: "2024-01", liquidity: 50000, positionValue: 0 },
      { date: "2024-02", liquidity: 47500, positionValue: 2800 },
      { date: "2024-03", liquidity: 46000, positionValue: 5200 },
      { date: "2024-04", liquidity: 44500, positionValue: 7600 },
      { date: "2024-05", liquidity: 43000, positionValue: 8900 },
      { date: "2024-06", liquidity: 42000, positionValue: 11400 },
      { date: "2024-07", liquidity: 41000, positionValue: 13800 },
      { date: "2024-08", liquidity: 40820, positionValue: 9180 },
    ],
  },
  {
    id: "3",
    name: "Trend Follower Elite",
    description: "Suit les tendances de long terme avec confirmation multi-timeframe",
    code: `def trend_following(data):
    # Multiple timeframe analysis
    ema_20 = data['close'].ewm(span=20).mean()
    ema_50 = data['close'].ewm(span=50).mean()
    ema_200 = data['close'].ewm(span=200).mean()
    
    # Trend confirmation
    if ema_20 > ema_50 > ema_200:
        return 'BUY'
    elif ema_20 < ema_50 < ema_200:
        return 'SELL'
    
    return 'HOLD'`,
    strategy: "Stratégie de suivi de tendance utilisant trois moyennes mobiles exponentielles (20, 50, 200). Entre en position longue quand les EMAs sont alignées à la hausse, en position courte quand elles sont alignées à la baisse.",
    roi: 31.7,
    totalPnL: 19020,
    winRate: 58.4,
    trades: 324,
    status: "active",
    performanceData: [
      { date: "2024-01", liquidity: 60000, positionValue: 0 },
      { date: "2024-02", liquidity: 58000, positionValue: 3500 },
      { date: "2024-03", liquidity: 55000, positionValue: 8200 },
      { date: "2024-04", liquidity: 52000, positionValue: 13600 },
      { date: "2024-05", liquidity: 48000, positionValue: 19800 },
      { date: "2024-06", liquidity: 45000, positionValue: 25400 },
      { date: "2024-07", liquidity: 42000, positionValue: 31200 },
      { date: "2024-08", liquidity: 40980, positionValue: 19020 },
    ],
  },
  {
    id: "4",
    name: "Volatility Hunter",
    description: "Capitalise sur les périodes de forte volatilité",
    code: `def volatility_strategy(data):
    # ATR and volatility metrics
    atr = calculate_atr(data, period=14)
    volatility = data['close'].pct_change().rolling(20).std()
    
    # Breakout detection
    if volatility > volatility.rolling(50).mean() * 1.5:
        if data['close'] > data['high'].rolling(20).max():
            return 'BUY'
    
    return 'HOLD'`,
    strategy: "Détecte les périodes de forte volatilité et trade les breakouts. Utilise l'ATR et la volatilité historique pour identifier les opportunités. Entre en position lors des breakouts confirmés par une volatilité élevée.",
    roi: 27.3,
    totalPnL: 13650,
    winRate: 61.2,
    trades: 567,
    status: "paused",
    performanceData: [
      { date: "2024-01", liquidity: 50000, positionValue: 0 },
      { date: "2024-02", liquidity: 46000, positionValue: 6800 },
      { date: "2024-03", liquidity: 44000, positionValue: 10200 },
      { date: "2024-04", liquidity: 41000, positionValue: 15600 },
      { date: "2024-05", liquidity: 39000, positionValue: 18900 },
      { date: "2024-06", liquidity: 37500, positionValue: 22400 },
      { date: "2024-07", liquidity: 36350, positionValue: 27300 },
      { date: "2024-08", liquidity: 36350, positionValue: 13650 },
    ],
  },
];
