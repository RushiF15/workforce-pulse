"use client";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SearchOutlined, SwapOutlined, UpOutlined, DownOutlined, LeftOutlined, RightOutlined, UserDeleteOutlined } from "@ant-design/icons";
import { formatCurrency, formatHours } from "@/lib/utils";
import { EmployeeSummary } from "@/types/dashboard";

import { Pagination } from "antd";

interface EmployeeTableProps {
  employees: EmployeeSummary[];
  onEmployeeClick: (employeeId: string) => void;
  className?: string;
}

type SortKey = "name" | "department" | "totalHours" | "recoverableHours" | "recoverableCost" | "efficiencyScore";
type SortDirection = "asc" | "desc";

export function EmployeeTable({ employees, onEmployeeClick, className }: EmployeeTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("recoverableHours");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Reset page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // Filter and Sort Data
  const filteredAndSortedEmployees = React.useMemo(() => {
    let result = [...employees];

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(lower) ||
          emp.department.toLowerCase().includes(lower) ||
          emp.role.toLowerCase().includes(lower) ||
          emp.email.toLowerCase().includes(lower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = a[sortKey];
      let bVal: string | number = b[sortKey];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        // Numbers
        aVal = aVal as number;
        bVal = bVal as number;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
    });

    return result;
  }, [employees, searchTerm, sortKey, sortDirection]);

  // Paginated data
  const paginatedEmployees = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedEmployees, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);

  const SortHeader = ({ columnKey, label, className }: { columnKey: SortKey; label: string; className?: string }) => {
    const isActive = sortKey === columnKey;
    return (
      <TableHead className={className}>
        <button
          onClick={() => handleSort(columnKey)}
          className={`inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-50 font-bold ${
            isActive ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500"
          }`}
        >
          {label}
          {isActive ? (
            sortDirection === "asc" ? (
              <UpOutlined className="text-[10px]" />
            ) : (
              <DownOutlined className="text-[10px]" />
            )
          ) : (
            <SwapOutlined className="rotate-90 text-[10px] text-zinc-400" />
          )}
        </button>
      </TableHead>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30";
    if (score >= 70) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30";
    return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30";
  };

  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 w-full overflow-hidden ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold">Employee Performance Matrix</CardTitle>
            <CardDescription>
              Browse team metrics, recoverable waste hours, estimated labor cost leakage, and individual performance.
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <Input
              placeholder="Filter by name, department, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs rounded-full border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-50 focus:bg-white dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50 dark:focus:bg-zinc-950 transition-all"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader columnKey="name" label="Employee Details" className="min-w-[200px]" />
                <SortHeader columnKey="department" label="Department" />
                <SortHeader columnKey="totalHours" label="Total Logged" className="text-right" />
                <SortHeader columnKey="recoverableHours" label="Recoverable" className="text-right" />
                <SortHeader columnKey="recoverableCost" label="Recoverable Cost" className="text-right" />
                <SortHeader columnKey="efficiencyScore" label="Efficiency" className="text-center" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                      <UserDeleteOutlined className="text-[28px] text-zinc-450" />
                      <span className="text-sm font-medium">No team members match your criteria</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    onClick={() => onEmployeeClick(emp.id)}
                    className="cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 active:bg-zinc-100/50 dark:active:bg-zinc-900/40 transition-colors"
                    title={`Click to view details for ${emp.name}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={getInitials(emp.name)} src="" className="h-9 w-9 ring-1 ring-zinc-100 dark:ring-zinc-800" />
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:underline">
                            {emp.name}
                          </span>
                          <span className="text-3xs text-zinc-400 dark:text-zinc-500 font-medium truncate">
                            {emp.role}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {emp.department}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {formatHours(emp.totalHours)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-amber-600 dark:text-amber-400">
                      {formatHours(emp.recoverableHours)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(emp.recoverableCost)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getEfficiencyColor(emp.efficiencyScore)}`}>
                          {emp.efficiencyScore}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-100 dark:border-zinc-900/80 px-6 py-4 gap-4">
            <span className="text-xs text-zinc-500 font-medium">
              Showing page {currentPage} of {totalPages} ({filteredAndSortedEmployees.length} total)
            </span>
            <Pagination
              current={currentPage}
              pageSize={itemsPerPage}
              total={filteredAndSortedEmployees.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              size="small"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
