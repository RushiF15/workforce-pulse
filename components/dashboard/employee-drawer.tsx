"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ClockCircleOutlined, TransactionOutlined, RiseOutlined, LaptopOutlined, ReloadOutlined, MailOutlined, BankOutlined } from "@ant-design/icons";
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetContent,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, formatHours } from "@/lib/utils";
import { EmployeeDetail } from "@/types/dashboard";

interface EmployeeDrawerProps {
  employee: EmployeeDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmployeeDrawer({ employee, isOpen, onClose }: EmployeeDrawerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!employee) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <SheetHeader className="pr-12">
        <div className="flex items-center gap-4">
          <Avatar
            fallback={getInitials(employee.name)}
            src={employee.avatarUrl}
            className="h-14 w-14 ring-2 ring-zinc-150 dark:ring-zinc-800 text-lg"
          />
          <div className="flex flex-col text-left">
            <SheetTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {employee.name}
            </SheetTitle>
            <SheetDescription className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
              {employee.role}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <SheetContent className="space-y-6">
        {/* Contact Info Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 text-zinc-650 dark:text-zinc-400">
            <BankOutlined className="text-zinc-400 shrink-0 text-[14px]" />
            <span className="font-semibold truncate">{employee.department}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 text-zinc-650 dark:text-zinc-400">
            <MailOutlined className="text-zinc-400 shrink-0 text-[14px]" />
            <span className="font-semibold truncate" title={employee.email}>
              {employee.email}
            </span>
          </div>
        </div>

        {/* Small Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col p-3 rounded-lg border border-amber-100 bg-amber-50/30 dark:border-amber-950/20 dark:bg-amber-950/10">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
              <ClockCircleOutlined className="text-[12px]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Recoverable</span>
            </div>
            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              {formatHours(employee.kpis.recoverableHours)}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-rose-100 bg-rose-50/30 dark:border-rose-950/20 dark:bg-rose-950/10">
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1">
              <TransactionOutlined className="text-[12px]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Waste Cost</span>
            </div>
            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              {formatCurrency(employee.kpis.recoverableCost)}
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-lg border border-blue-100 bg-blue-50/30 dark:border-blue-950/20 dark:bg-blue-950/10">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
              <RiseOutlined className="text-[12px]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Activities</span>
            </div>
            <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              {employee.kpis.totalActivities.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Weekly Recovery Trend
          </h3>
          <div className="h-[180px] w-full max-w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 bg-white dark:bg-zinc-950">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={employee.weeklyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.1)" />
                  <XAxis
                    dataKey="week"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid rgb(228, 228, 231)",
                      borderRadius: "6px",
                      fontSize: "10px",
                    }}
                    itemStyle={{ color: "#f59e0b" }}
                  />
                  <Line
                    type="monotone"
                    name="Waste Hours"
                    dataKey="hours"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
            )}
          </div>
        </div>

        {/* App Activity Summary (Horizontal progress bars) */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <LaptopOutlined className="text-[14px]" />
            <span>Application Time Distribution</span>
          </h3>
          <div className="space-y-2.5">
            {employee.activitySummary.map((activity, idx) => {
              const maxHours = Math.max(...employee.activitySummary.map((a) => a.hours));
              const percentage = maxHours > 0 ? (activity.hours / maxHours) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-800 dark:text-zinc-200">{activity.appName}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{formatHours(activity.hours)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Repetitive Tasks */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <ReloadOutlined className="text-[14px]" />
            <span>Repetitive Wastes Identified</span>
          </h3>
          <div className="space-y-2">
            {employee.topRepetitiveTasks.map((task, idx) => (
              <Card key={idx} className="border-zinc-200 dark:border-zinc-800 hover:shadow-xs transition-shadow">
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {task.taskName}
                    </span>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold mt-0.5">
                      Triggers: {task.frequency}x per week
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-sm border border-amber-100 dark:border-amber-900/30 shrink-0">
                    {formatHours(task.hours)} waste
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
