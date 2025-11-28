def trend_following(data):
    # Multiple timeframe analysis
    ema_20 = data['close'].ewm(span=20).mean()
    ema_50 = data['close'].ewm(span=50).mean()
    ema_200 = data['close'].ewm(span=200).mean()

    # Trend confirmation
    if ema_20 > ema_50 > ema_200:
        return 'BUY'
    elif ema_20 < ema_50 < ema_200:
        return 'SELL'

    return 'HOLD'
