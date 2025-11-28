def volatility_strategy(data):
    # ATR and volatility metrics
    atr = calculate_atr(data, period=14)
    volatility = data['close'].pct_change().rolling(20).std()

    # Breakout detection
    if volatility > volatility.rolling(50).mean() * 1.5:
        if data['close'] > data['high'].rolling(20).max():
            return 'BUY'

    return 'HOLD'
