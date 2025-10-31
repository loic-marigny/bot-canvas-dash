# Workflows GitHub Actions

## deploy.yml
Déploie automatiquement le site sur GitHub Pages lors d'un push sur la branche `main`.

### Configuration requise
1. Aller dans Settings > Pages
2. Sélectionner "GitHub Actions" comme source de déploiement

## update-bot-data.yml
Met à jour les données des bots et redéploie le site.

### Utilisation depuis un workflow de bot

```yaml
name: Mon Bot Trading

on:
  schedule:
    - cron: '0 * * * *'  # Toutes les heures

jobs:
  trade:
    runs-on: ubuntu-latest
    steps:
      - name: Execute trading bot
        run: |
          # Votre logique de trading ici
          # ...
      
      - name: Update bot data
        uses: actions/github-script@v7
        with:
          script: |
            const botData = {
              bots: [
                {
                  id: "bot-1",
                  name: "Mon Bot",
                  totalProfit: 1500.50,
                  profitPercentage: 15.5,
                  trades: 42,
                  winRate: 65.5,
                  status: "active",
                  startDate: "2024-01-01T00:00:00.000Z",
                  openTrades: [...],
                  closedTrades: [...]
                }
              ],
              lastUpdated: new Date().toISOString()
            };
            
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'update-bot-data.yml',
              ref: 'main',
              inputs: {
                bot_data: JSON.stringify(botData)
              }
            });
```

## Structure des données

### Format du fichier bots.json

```json
{
  "bots": [
    {
      "id": "string",
      "name": "string",
      "totalProfit": "number",
      "profitPercentage": "number",
      "trades": "number",
      "winRate": "number",
      "status": "active" | "paused" | "stopped",
      "startDate": "ISO date string",
      "openTrades": [
        {
          "id": "string",
          "company": "string",
          "logo": "string (URL)",
          "quantity": "number",
          "buyPrice": "number",
          "buyValue": "number",
          "currentPrice": "number",
          "currentValue": "number",
          "profitLoss": "number",
          "profitLossPercentage": "number",
          "buyDate": "ISO date string"
        }
      ],
      "closedTrades": [
        {
          "id": "string",
          "company": "string",
          "logo": "string (URL)",
          "quantity": "number",
          "buyPrice": "number",
          "buyValue": "number",
          "sellPrice": "number",
          "sellValue": "number",
          "profitLoss": "number",
          "profitLossPercentage": "number",
          "buyDate": "ISO date string",
          "sellDate": "ISO date string"
        }
      ]
    }
  ],
  "lastUpdated": "ISO date string"
}
```
