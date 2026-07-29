import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatHours } from "@/lib/utils";
import { AutomationTask } from "@/types/dashboard";
import { ThunderboltFilled } from "@ant-design/icons";

interface PriorityTableProps {
  tasks: AutomationTask[];
  className?: string;
}

export function PriorityTable({ tasks, className }: PriorityTableProps) {
  const getPriorityBadge = (priority: AutomationTask["priority"]) => {
    switch (priority) {
      case "High":
        return <Badge variant="destructive" className="gap-1 shadow-xs"><ThunderboltFilled className="text-rose-600 dark:text-rose-400 text-[11px]" /> High</Badge>;
      case "Medium":
        return <Badge variant="warning" className="gap-1 shadow-xs"><ThunderboltFilled className="text-amber-600 dark:text-amber-400 text-[11px]" /> Medium</Badge>;
      case "Low":
        return <Badge variant="info" className="gap-1 shadow-xs"><ThunderboltFilled className="text-blue-600 dark:text-blue-400 text-[11px]" /> Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 w-full overflow-hidden ${className || ""}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span>Automation Priority Candidates</span>
            </CardTitle>
            <CardDescription>
              Repetitive manual operations with the highest potential savings from automation
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-full bg-amber-50/50 dark:bg-amber-950/20 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
            <ThunderboltFilled className="text-amber-600 dark:text-amber-400 text-[13px]" />
            <span>AI Identified Opportunities</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-0 sm:px-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center font-bold">Rank</TableHead>
                <TableHead className="min-w-[180px] font-bold">Manual Task Operation</TableHead>
                <TableHead className="text-right font-bold">Wasted Hours</TableHead>
                <TableHead className="text-right font-bold">Impacted Employees</TableHead>
                <TableHead className="text-right font-bold">Estimated Savings (Monthly)</TableHead>
                <TableHead className="text-center font-bold">Priority Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                    No automation tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.rank} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 transition-colors">
                    <TableCell className="text-center font-extrabold text-zinc-400 dark:text-zinc-650">
                      #{task.rank}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {task.taskName}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-zinc-700 dark:text-zinc-300">
                      {formatHours(task.hours)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-zinc-600 dark:text-zinc-400">
                      {task.employeeCount} {task.employeeCount === 1 ? "employee" : "employees"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(task.estimatedSavings)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {getPriorityBadge(task.priority)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
