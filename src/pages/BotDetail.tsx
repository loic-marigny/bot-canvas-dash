import { useParams, Link } from "react-router-dom";
import { mockBots } from "@/data/mockBots";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Activity, DollarSign, Target, Calendar } from "lucide-react";
import { PerformanceChart } from "@/components/PerformanceChart";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

const BotDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const bot = mockBots.find((b) => b.id === id);
  const locale = i18n.language === 'fr' ? fr : enUS;

  if (!bot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Bot non trouvé</h1>
          <Link to="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = bot.roi >= 0;
  const statusColors = {
    active: "bg-success/20 text-success border-success/30",
    paused: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    stopped: "bg-muted text-muted-foreground border-border",
  };
  
  const statusLabels = {
    active: t('botDetail.status.active'),
    paused: t('botDetail.status.paused'),
    stopped: t('botDetail.status.stopped'),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('botDetail.back')}
          </Button>
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{bot.name}</h1>
            <p className="text-lg text-muted-foreground">{bot.description}</p>
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{t('botDetail.runningSince')} {format(new Date(bot.startDate), 'PP', { locale })}</span>
            </div>
          </div>
          <Badge className={statusColors[bot.status]} variant="outline">
            {statusLabels[bot.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>{t('botDetail.roi')}</span>
            </div>
            <p className={`text-3xl font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
              {isPositive ? "+" : ""}{bot.roi.toFixed(1)}%
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span>{t('botDetail.pnl')}</span>
            </div>
            <p className={`text-3xl font-bold ${bot.totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
              {bot.totalPnL >= 0 ? "+" : ""}${bot.totalPnL.toLocaleString()}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span>{t('botDetail.winRate')}</span>
            </div>
            <p className="text-3xl font-bold">{bot.winRate.toFixed(1)}%</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span>{t('botDetail.trades')}</span>
            </div>
            <p className="text-3xl font-bold">{bot.trades.toLocaleString()}</p>
          </Card>
        </div>

        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">{t('botDetail.performance')}</h2>
          <PerformanceChart data={bot.performanceData} />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t('botDetail.strategy')}</h2>
            <p className="text-muted-foreground leading-relaxed">{bot.strategy}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t('botDetail.code')}</h2>
            <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-foreground">{bot.code}</code>
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BotDetail;
