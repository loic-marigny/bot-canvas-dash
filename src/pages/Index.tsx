import { mockBots } from "@/data/mockBots";
import { BotCard } from "@/components/BotCard";
import { Activity } from "lucide-react";

const Index = () => {
  const totalPnL = mockBots.reduce((acc, bot) => acc + bot.totalPnL, 0);
  const avgRoi = mockBots.reduce((acc, bot) => acc + bot.roi, 0) / mockBots.length;
  const activeBots = mockBots.filter((bot) => bot.status === "active").length;
  const totalTrades = mockBots.reduce((acc, bot) => acc + bot.trades, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-10 h-10 text-primary" />
            <h1 className="text-5xl font-bold">Trading Bots Dashboard</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Surveillez et gérez vos bots de trading algorithmique
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">P&L Total</div>
            <div className={`text-3xl font-bold ${totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString()}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">ROI Moyen</div>
            <div className={`text-3xl font-bold ${avgRoi >= 0 ? "text-success" : "text-destructive"}`}>
              {avgRoi >= 0 ? "+" : ""}{avgRoi.toFixed(1)}%
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">Bots Actifs</div>
            <div className="text-3xl font-bold text-primary">{activeBots}/{mockBots.length}</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Trades</div>
            <div className="text-3xl font-bold">{totalTrades.toLocaleString()}</div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">Mes Bots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {mockBots.map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
