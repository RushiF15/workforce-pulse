import * as React from "react";
import { ClockCircleOutlined, TransactionOutlined, TeamOutlined, RiseOutlined } from "@ant-design/icons";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatHours } from "@/lib/utils";
import { DashboardKPIs } from "@/types/dashboard";

interface KpiCardsProps {
  kpis: DashboardKPIs;
  className?: string;
}

export function KpiCards({ kpis, className }: KpiCardsProps) {
  const cardData = [
    {
      title: "Recoverable Hours",
      value: formatHours(kpis.recoverableHours),
      description: "Potential hours saved by automation",
      icon: ClockCircleOutlined,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-100 dark:border-amber-900/30",
      trend: "14.2% of total logged time",
      trendType: "neutral",
    },
    {
      title: "Recoverable Cost",
      value: formatCurrency(kpis.recoverableCost),
      description: "Direct labor cost leak detected",
      icon: TransactionOutlined,
      iconColor: "text-rose-500 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
      borderColor: "border-rose-100 dark:border-rose-900/30",
      trend: "Est. annual savings: " + formatCurrency(kpis.recoverableCost * 12),
      trendType: "positive",
    },
    {
      title: "Total Employees",
      value: kpis.totalEmployees.toLocaleString(),
      description: "Active employees tracked",
      icon: TeamOutlined,
      iconColor: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-100 dark:border-blue-900/30",
      trend: "98.5% user adoption rate",
      trendType: "positive",
    },
    {
      title: "Total Activities Logged",
      value: kpis.totalActivities.toLocaleString(),
      description: "Daily task updates cataloged",
      icon: RiseOutlined,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-100 dark:border-emerald-900/30",
      trend: "+5.3% increase in efficiency",
      trendType: "positive",
    },
  ];

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className || ""}`}>
      {cardData.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`relative overflow-hidden border-t-2 ${card.borderColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-zinc-950/40`}
          >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full blur-2xl opacity-20 dark:opacity-10 ${card.bgColor}`} />
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {card.title}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bgColor} ${card.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-0.5">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {card.value}
                </span>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                  {card.description}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900/80 flex items-center">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {card.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
