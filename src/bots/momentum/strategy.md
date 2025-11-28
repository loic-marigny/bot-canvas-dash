# Momentum Scalper Strategy

- Observe uniquement l'évolution entre le dernier prix et le précédent.
- Si le prix grimpe d'environ 0,1 % et que la trésorerie suffit pour un lot, le bot achète.
- Si le prix recule d'environ 0,1 % et que le portefeuille détient au moins un lot, le bot vend.
- Dans les autres cas, aucune action n'est envoyée et la position est conservée.
