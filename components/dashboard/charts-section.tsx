"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatHours } from "@/lib/utils";
import {
  TimeByDepartmentData,
  TimeByAppData,
  TimeByTaskCategoryData,
  WeeklyTrendData,
} from "@/types/dashboard";

interface ChartsSectionProps {
  timeByDepartment: TimeByDepartmentData[];
  timeByApp: TimeByAppData[];
  timeByTaskCategory: TimeByTaskCategoryData[];
  weeklyTrend: WeeklyTrendData[];
  className?: string;
}

const COLORS = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#8b5cf6", // Violet
];

// Custom Tooltip component matching shadcn design system
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-md backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-950/95">
        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-3 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">{item.name}:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatter ? formatter(item.value) : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ChartsSection({
  timeByDepartment,
  timeByApp,
  timeByTaskCategory,
  weeklyTrend,
  className,
}: ChartsSectionProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(false); // Reset just in case
    setMounted(true);
  }, []);

  const renderLoader = () => (
    <div className="flex h-[300px] w-full items-center justify-center rounded-lg bg-zinc-50/50 dark:bg-zinc-900/10">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
        <span className="text-xs text-zinc-500">Loading chart analytics...</span>
      </div>
    </div>
  );

  return (
    <div className={`grid gap-6 md:grid-cols-2 ${className || ""}`}>
      {/* 1. Time by Department */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Time & Waste by Department</CardTitle>
          <CardDescription>Total recoverable hours vs. current department cost leak</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {!mounted ? (
            renderLoader()
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeByDepartment} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.1)" />
                  <XAxis
                    dataKey="department"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ angle: -30, textAnchor: "end" }}
                    height={50}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}h`}
                  />
                  <Tooltip content={<CustomTooltip formatter={formatHours} />} cursor={{ fill: "rgba(120,120,120,0.05)" }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    name="Recoverable Hours"
                    dataKey="hours"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Time by App */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Application Distribution</CardTitle>
          <CardDescription>Breakdown of team time spent across active work applications</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 flex flex-col justify-center">
          {!mounted ? (
            renderLoader()
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 h-[300px]">
              <div className="h-[220px] w-[220px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip formatter={formatHours} />} />
                    <Pie
                      data={timeByApp}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="hours"
                      nameKey="appName"
                    >
                      {timeByApp.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends Custom */}
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] w-full px-2 sm:max-w-[200px]">
                {timeByApp.map((item, index) => (
                  <div key={item.appName} className="flex items-center justify-between text-xs border-b border-zinc-50 dark:border-zinc-900 pb-1.5 last:border-0">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-zinc-700 dark:text-zinc-350 truncate">
                        {item.appName}
                      </span>
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 pl-2">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Time by Task Category */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Time by Task Category</CardTitle>
          <CardDescription>Total logged activity hours grouped by task classification</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {!mounted ? (
            renderLoader()
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeByTaskCategory}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(120,120,120,0.1)" />
                  <XAxis
                    type="number"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}h`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip formatter={formatHours} />} cursor={{ fill: "rgba(120,120,120,0.05)" }} />
                  <Bar
                    name="Logged Hours"
                    dataKey="hours"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Weekly Trend */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Weekly Performance Trend</CardTitle>
          <CardDescription>Productive hours vs. Recoverable hours trend over past weeks</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {!mounted ? (
            renderLoader()
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProductive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRecoverable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.1)" />
                  <XAxis
                    dataKey="week"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}h`}
                  />
                  <Tooltip content={<CustomTooltip formatter={formatHours} />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    name="Productive Hours"
                    dataKey="productiveHours"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProductive)"
                  />
                  <Area
                    type="monotone"
                    name="Recoverable Hours"
                    dataKey="recoverableHours"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRecoverable)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
