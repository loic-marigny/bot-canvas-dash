def mean_reversion(data):
    # Bollinger Bands
    bb_upper, bb_middle, bb_lower = calculate_bb(data, period=20, std=2)

    # Z-score
    z_score = (data['close'] - bb_middle) / (bb_upper - bb_middle)

    # Entry/Exit logic
    if z_score < -1.5:
        return 'BUY'
    elif z_score > 1.5:
        return 'SELL'

    return 'HOLD'
