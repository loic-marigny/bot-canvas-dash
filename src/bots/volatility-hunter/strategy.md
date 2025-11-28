# Volatility Hunter Strategy

- Computes ATR(14) and 20 day realized volatility.
- Requires current volatility to exceed 1.5x the 50 day rolling baseline.
- Confirms breakouts when price makes new 20 day highs.
- Only one leg open at a time to limit tail risk.
