import { Bot } from "@/types/bot";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from "lucide-react";
import { Link } from "react-router-dom";

interface BotCardProps {
  bot: Bot;
}

export const BotCard = ({ bot }: BotCardProps) => {
  const isPositive = bot.roi >= 0;
  
  const statusColors = {
    active: "bg-success/20 text-success border-success/30",
    paused: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    stopped: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Link to={`/bot/${bot.id}`}>
      <Card className="p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
              {bot.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{bot.description}</p>
          </div>
          <Badge className={statusColors[bot.status]}>
            {bot.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-success" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              )}
              <span>ROI</span>
            </div>
            <p className={`text-2xl font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
              {isPositive ? "+" : ""}{bot.roi.toFixed(1)}%
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>P&L</span>
            </div>
            <p className={`text-2xl font-bold ${bot.totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
              {bot.totalPnL >= 0 ? "+" : ""}${bot.totalPnL.toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>Win Rate</span>
            </div>
            <p className="text-xl font-semibold">{bot.winRate.toFixed(1)}%</p>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Trades</div>
            <p className="text-xl font-semibold">{bot.trades.toLocaleString()}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};
