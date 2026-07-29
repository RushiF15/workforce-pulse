import * as React from "react";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterOptions, FilterState } from "@/types/dashboard";

interface FiltersSectionProps {
  options: FilterOptions;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  className?: string;
}

export function FiltersSection({
  options,
  filters,
  onFilterChange,
  onReset,
  className,
}: FiltersSectionProps) {
  // Sort or prepare employee lists
  const sortedEmployees = React.useMemo(() => {
    // If a department is selected, filter employees list by department
    let list = options.employees;
    if (filters.department && filters.department !== "all") {
      list = list.filter((emp) => emp.department === filters.department);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [options.employees, filters.department]);

  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 ${className || ""}`}>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-sm">
              <FilterOutlined className="text-zinc-500" />
              <span>Filter Insights</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 gap-1.5 text-xs font-semibold"
            >
              <ReloadOutlined className="text-[11px]" />
              Reset filters
            </Button>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Department Selector */}
            <Select
              label="Department"
              value={filters.department}
              onChange={(e) => onFilterChange("department", e.target.value)}
            >
              <option value="all">All Departments</option>
              {options.departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>

            {/* Employee Selector */}
            <Select
              label="Employee"
              value={filters.employeeId}
              onChange={(e) => onFilterChange("employeeId", e.target.value)}
            >
              <option value="all">All Employees</option>
              {sortedEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </Select>

            {/* Date Range Selector */}
            <Select
              label="Date Range"
              value={filters.dateRange}
              onChange={(e) => onFilterChange("dateRange", e.target.value)}
            >
              {options.dateRanges.map((range) => (
                <option key={range.label} value={range.label}>
                  {range.label}
                </option>
              ))}
            </Select>

            {/* Task Category Selector */}
            <Select
              label="Task Category"
              value={filters.taskCategory}
              onChange={(e) => onFilterChange("taskCategory", e.target.value)}
            >
              <option value="all">All Categories</option>
              {options.taskCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
