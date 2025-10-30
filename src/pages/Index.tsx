import { mockBots } from "@/data/mockBots";
import { BotCard } from "@/components/BotCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  const totalPnL = mockBots.reduce((acc, bot) => acc + bot.totalPnL, 0);
  const avgRoi = mockBots.reduce((acc, bot) => acc + bot.roi, 0) / mockBots.length;
  const activeBots = mockBots.filter((bot) => bot.status === "active").length;
  const totalTrades = mockBots.reduce((acc, bot) => acc + bot.trades, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Activity className="w-10 h-10 text-primary" />
              <h1 className="text-5xl font-bold">{t('dashboard.title')}</h1>
            </div>
            <LanguageSwitcher />
          </div>
          <p className="text-xl text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">{t('dashboard.totalPnl')}</div>
            <div className={`text-3xl font-bold ${totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString()}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">{t('dashboard.avgRoi')}</div>
            <div className={`text-3xl font-bold ${avgRoi >= 0 ? "text-success" : "text-destructive"}`}>
              {avgRoi >= 0 ? "+" : ""}{avgRoi.toFixed(1)}%
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">{t('dashboard.activeBots')}</div>
            <div className="text-3xl font-bold text-primary">{activeBots}/{mockBots.length}</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">{t('dashboard.totalTrades')}</div>
            <div className="text-3xl font-bold">{totalTrades.toLocaleString()}</div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">{t('dashboard.myBots')}</h2>
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
