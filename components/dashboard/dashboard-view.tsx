"use client";

import * as React from "react";
import { Navbar } from "./navbar";
import { FiltersSection } from "./filters-section";
import { KpiCards } from "./kpi-cards";
import { ChartsSection } from "./charts-section";
import { PriorityTable } from "./priority-table";
import { EmployeeTable } from "./employee-table";
import { EmployeeDrawer } from "./employee-drawer";
import { AiAssistant } from "./ai-assistant";
import { Footer } from "./footer";
import { FilterState, EmployeeDetail } from "@/types/dashboard";
import type { WorkforceDataset } from "@/data-pipeline";
import { costOfMinutes } from "@/data-pipeline";

// Helper to compute all metrics and charts dynamically based on active filters
export function computeDashboardData(dataset: WorkforceDataset, filters: FilterState) {
  // 1. Filter employees
  let filteredEmployees = dataset.employees;
  if (filters.department !== "all") {
    filteredEmployees = filteredEmployees.filter(e => e.department === filters.department);
  }
  if (filters.employeeId !== "all") {
    filteredEmployees = filteredEmployees.filter(e => e.employeeId === filters.employeeId);
  }
  const employeeIdsSet = new Set(filteredEmployees.map(e => e.employeeId));

  // 2. Filter activities
  let filteredActivities = dataset.activities;
  // Activities must belong to the filtered employees
  filteredActivities = filteredActivities.filter(act => act.employeeId && employeeIdsSet.has(act.employeeId));

  // Filter activities by task category
  if (filters.taskCategory !== "all") {
    filteredActivities = filteredActivities.filter(act => 
      act.taskCategoryLabel.toLowerCase() === filters.taskCategory.toLowerCase() ||
      act.taskCategoryId === filters.taskCategory
    );
  }

  // 3. Compute KPIs
  let totalDurationMinutes = 0;
  let repetitiveMinutes = 0;
  let recoverableCost = 0;
  const activeEmpIds = new Set<string>();

  filteredActivities.forEach(act => {
    if (act.employeeId) {
      activeEmpIds.add(act.employeeId);
    }
    const mins = act.durationMinutes ?? 0;
    totalDurationMinutes += mins;
    if (act.isRepetitive) {
      repetitiveMinutes += mins;
      if (act.employeeId) {
        const emp = dataset.byEmployee[act.employeeId]?.employee;
        if (emp) {
          recoverableCost += costOfMinutes(emp.compensation, mins) ?? 0;
        }
      }
    }
  });

  const recoverableHours = repetitiveMinutes / 60;

  // 4. Compute Time by Department (recoverable hours and costs)
  const deptHours: Record<string, { mins: number, cost: number }> = {};
  filteredActivities.forEach(act => {
    const dept = act.reportedDepartment;
    if (!deptHours[dept]) {
      deptHours[dept] = { mins: 0, cost: 0 };
    }
    if (act.isRepetitive) {
      const mins = act.durationMinutes ?? 0;
      deptHours[dept].mins += mins;
      if (act.employeeId) {
        const emp = dataset.byEmployee[act.employeeId]?.employee;
        if (emp) {
          deptHours[dept].cost += costOfMinutes(emp.compensation, mins) ?? 0;
        }
      }
    }
  });
  const timeByDepartment = Object.entries(deptHours).map(([department, data]) => ({
    department,
    hours: Math.round((data.mins / 60) * 10) / 10,
    cost: Math.round(data.cost),
  })).sort((a, b) => b.hours - a.hours);

  // 5. Compute Time by App
  const appHours: Record<string, number> = {};
  let totalAppMins = 0;
  filteredActivities.forEach(act => {
    if (act.durationMinutes) {
      appHours[act.appLabel] = (appHours[act.appLabel] || 0) + act.durationMinutes;
      totalAppMins += act.durationMinutes;
    }
  });
  const timeByApp = Object.entries(appHours).map(([appName, mins]) => ({
    appName,
    hours: Math.round((mins / 60) * 10) / 10,
    percentage: totalAppMins > 0 ? Math.round((mins / totalAppMins) * 100) : 0,
  })).sort((a, b) => b.hours - a.hours).slice(0, 7); // top 7 apps

  // 6. Compute Time by Task Category
  const catHours: Record<string, number> = {};
  filteredActivities.forEach(act => {
    if (act.durationMinutes) {
      catHours[act.taskCategoryLabel] = (catHours[act.taskCategoryLabel] || 0) + act.durationMinutes;
    }
  });
  const timeByTaskCategory = Object.entries(catHours).map(([category, mins]) => ({
    category,
    hours: Math.round((mins / 60) * 10) / 10,
  })).sort((a, b) => b.hours - a.hours).slice(0, 10); // top 10 categories

  // 7. Compute Weekly Trend
  const weeklyData: Record<string, { productiveMins: number, recoverableMins: number }> = {};
  filteredActivities.forEach(act => {
    const week = act.isoWeek;
    if (!weeklyData[week]) {
      weeklyData[week] = { productiveMins: 0, recoverableMins: 0 };
    }
    const mins = act.durationMinutes ?? 0;
    if (act.isRepetitive) {
      weeklyData[week].recoverableMins += mins;
    } else {
      weeklyData[week].productiveMins += mins;
    }
  });
  const weeklyTrend = Object.entries(weeklyData).map(([week, data]) => ({
    week: week.replace(/^\d{4}-/, ""), // Format "2025-W41" to "W41"
    productiveHours: Math.round((data.productiveMins / 60) * 10) / 10,
    recoverableHours: Math.round((data.recoverableMins / 60) * 10) / 10,
  })).sort((a, b) => a.week.localeCompare(b.week));

  // 8. Compute Automation Tasks Candidates
  const taskGroups: Record<string, {
    taskCategoryLabel: string;
    appLabel: string;
    totalMins: number;
    employeeIds: Set<string>;
    totalCost: number;
  }> = {};

  filteredActivities.forEach(act => {
    if (act.isRepetitive && act.isAutomatableCategory) {
      const key = `${act.taskCategoryLabel}|${act.appLabel}`;
      if (!taskGroups[key]) {
        taskGroups[key] = {
          taskCategoryLabel: act.taskCategoryLabel,
          appLabel: act.appLabel,
          totalMins: 0,
          employeeIds: new Set(),
          totalCost: 0,
        };
      }
      const mins = act.durationMinutes ?? 0;
      taskGroups[key].totalMins += mins;
      if (act.employeeId) {
        taskGroups[key].employeeIds.add(act.employeeId);
        const emp = dataset.byEmployee[act.employeeId]?.employee;
        if (emp) {
          taskGroups[key].totalCost += costOfMinutes(emp.compensation, mins) ?? 0;
        }
      }
    }
  });

  // Calculate monthly scaling
  const daysCount = dataset.dateRange.start && dataset.dateRange.end
    ? (new Date(dataset.dateRange.end).getTime() - new Date(dataset.dateRange.start).getTime()) / (1000 * 60 * 60 * 24)
    : 1;
  const scalingFactor = daysCount > 0 ? 30 / daysCount : 1;

  const automationTasks = Object.values(taskGroups).map(group => {
    const hours = group.totalMins / 60;
    const estimatedSavings = group.totalCost * scalingFactor;
    let priority: "High" | "Medium" | "Low" = "Low";
    if (hours >= 10) {
      priority = "High";
    } else if (hours >= 3) {
      priority = "Medium";
    }
    return {
      taskName: `${group.taskCategoryLabel} (${group.appLabel})`,
      hours: Math.round(hours * 10) / 10,
      employeeCount: group.employeeIds.size,
      estimatedSavings: Math.round(estimatedSavings),
      priority,
    };
  })
  .sort((a, b) => b.estimatedSavings - a.estimatedSavings)
  .map((task, index) => ({
    rank: index + 1,
    ...task,
  }));

  // 9. Compute Employee Summaries
  const employees = filteredEmployees.map(emp => {
    const summary = dataset.byEmployee[emp.employeeId]?.summary;
    const empActs = dataset.byEmployee[emp.employeeId]?.activities || [];
    
    let totalMins = 0;
    let repMins = 0;
    let cost = 0;

    empActs.forEach(act => {
      if (filters.taskCategory !== "all" && 
          act.taskCategoryLabel.toLowerCase() !== filters.taskCategory.toLowerCase() &&
          act.taskCategoryId !== filters.taskCategory) {
        return;
      }
      const mins = act.durationMinutes ?? 0;
      totalMins += mins;
      if (act.isRepetitive) {
        repMins += mins;
        cost += costOfMinutes(emp.compensation, mins) ?? 0;
      }
    });

    const totalHours = totalMins / 60;
    const recHours = repMins / 60;
    const efficiencyScore = totalMins > 0 ? Math.round(100 * (1 - (repMins / totalMins))) : 100;
    const email = emp.displayName.toLowerCase().replace(/\s+/g, '.') + "@workforcepulse.com";

    return {
      id: emp.employeeId,
      name: emp.displayName,
      email,
      department: emp.department,
      role: emp.role ?? 'Unknown Role',
      totalHours: Math.round(totalHours * 10) / 10,
      recoverableHours: Math.round(recHours * 10) / 10,
      recoverableCost: Math.round(cost),
      efficiencyScore,
    };
  });

  return {
    kpis: {
      recoverableHours: Math.round(recoverableHours * 10) / 10,
      recoverableCost: Math.round(recoverableCost),
      totalEmployees: activeEmpIds.size > 0 ? activeEmpIds.size : filteredEmployees.length,
      totalActivities: filteredActivities.length,
    },
    employees,
    automationTasks,
    timeByDepartment,
    timeByApp,
    timeByTaskCategory,
    weeklyTrend,
  };
}

// Compute dynamic filter options from the dataset
function computeFilterOptions(dataset: WorkforceDataset) {
  const departments = Array.from(new Set(dataset.employees.map(e => e.department))).sort();
  const employees = dataset.employees.map(e => ({
    id: e.employeeId,
    name: e.displayName,
    department: e.department,
  })).sort((a, b) => a.name.localeCompare(b.name));
  
  const dateRanges = [
    { label: "October 2025 (All Logs)", start: dataset.dateRange.start ?? "", end: dataset.dateRange.end ?? "" }
  ];
  
  const taskCategories = Array.from(new Set(dataset.activities.map(a => a.taskCategoryLabel))).sort();

  return {
    departments,
    employees,
    dateRanges,
    taskCategories,
  };
}

interface DashboardViewProps {
  dataset: WorkforceDataset;
}

export function DashboardView({ dataset }: DashboardViewProps) {
  // Force light theme
  React.useEffect(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
  }, []);

  const filterOptions = React.useMemo(() => computeFilterOptions(dataset), [dataset]);

  // 1. Dashboard Filters State
  const [filters, setFilters] = React.useState<FilterState>({
    department: "all",
    employeeId: "all",
    dateRange: filterOptions.dateRanges[0]?.label || "October 2025 (All Logs)",
    taskCategory: "all",
  });

  // 2. Global search term (shared from navbar)
  const [searchVal, setSearchVal] = React.useState("");

  // 3. Employee Drawer State
  const [selectedEmpId, setSelectedEmpId] = React.useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Reset filters
  const handleResetFilters = React.useCallback(() => {
    setFilters({
      department: "all",
      employeeId: "all",
      dateRange: filterOptions.dateRanges[0]?.label || "October 2025 (All Logs)",
      taskCategory: "all",
    });
  }, [filterOptions.dateRanges]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };
      
      // If department changes, check if the currently selected employee belongs to it.
      if (key === "department" && value !== "all") {
        const emp = filterOptions.employees.find((e) => e.id === prev.employeeId);
        if (emp && emp.department !== value) {
          updated.employeeId = "all";
        }
      }
      return updated;
    });
  };

  // 4. Calculate filtered dashboard state
  const filteredData = React.useMemo(() => {
    return computeDashboardData(dataset, filters);
  }, [dataset, filters]);

  // Handle opening employee drawer
  const handleEmployeeClick = (employeeId: string) => {
    setSelectedEmpId(employeeId);
    setIsDrawerOpen(true);
  };

  // Find or generate detail drawer data on the fly from raw dataset logs
  const activeEmployeeDetail = React.useMemo<EmployeeDetail | null>(() => {
    if (!selectedEmpId) return null;

    const emp = dataset.employees.find((e) => e.employeeId === selectedEmpId);
    if (!emp) return null;

    const empActivities = dataset.byEmployee[selectedEmpId]?.activities || [];
    const summary = dataset.byEmployee[selectedEmpId]?.summary;

    const appHours: Record<string, number> = {};
    empActivities.forEach(act => {
      if (act.durationMinutes) {
        appHours[act.appLabel] = (appHours[act.appLabel] || 0) + act.durationMinutes;
      }
    });
    const activitySummary = Object.entries(appHours).map(([appName, mins]) => ({
      appName,
      hours: Math.round((mins / 60) * 10) / 10,
    })).sort((a, b) => b.hours - a.hours).slice(0, 5);

    const taskHours: Record<string, { mins: number, count: number }> = {};
    empActivities.forEach(act => {
      if (act.isRepetitive) {
        const taskName = `${act.taskCategoryLabel} (${act.appLabel})`;
        if (!taskHours[taskName]) {
          taskHours[taskName] = { mins: 0, count: 0 };
        }
        taskHours[taskName].mins += act.durationMinutes ?? 0;
        taskHours[taskName].count += 1;
      }
    });
    const topRepetitiveTasks = Object.entries(taskHours).map(([taskName, data]) => ({
      taskName,
      hours: Math.round((data.mins / 60) * 10) / 10,
      frequency: data.count,
    })).sort((a, b) => b.hours - a.hours).slice(0, 5);

    const weeklyMins: Record<string, number> = {};
    empActivities.forEach(act => {
      if (act.isRepetitive) {
        weeklyMins[act.isoWeek] = (weeklyMins[act.isoWeek] || 0) + (act.durationMinutes ?? 0);
      }
    });
    const weeklyTrend = Object.entries(weeklyMins).map(([week, mins]) => ({
      week: week.replace(/^\d{4}-/, ""),
      hours: Math.round((mins / 60) * 10) / 10,
    })).sort((a, b) => a.week.localeCompare(b.week));

    const email = emp.displayName.toLowerCase().replace(/\s+/g, '.') + "@workforcepulse.com";
    const repMins = summary?.repetitiveMinutes ?? 0;
    const cost = costOfMinutes(emp.compensation, repMins) ?? 0;

    return {
      id: emp.employeeId,
      name: emp.displayName,
      email,
      department: emp.department,
      role: emp.role ?? 'Unknown Role',
      kpis: {
        recoverableHours: Math.round((repMins / 60) * 10) / 10,
        recoverableCost: Math.round(cost),
        totalActivities: empActivities.length,
      },
      activitySummary,
      topRepetitiveTasks,
      weeklyTrend,
    };
  }, [selectedEmpId, dataset]);

  // Handle Export button (Generates real CSV of filtered employees)
  const handleExport = () => {
    const headers = [
      "Employee ID",
      "Name",
      "Role",
      "Department",
      "Total Logged Hours",
      "Recoverable Hours",
      "Recoverable Cost (INR)",
      "Efficiency Score"
    ];
    const rows = filteredData.employees.map(emp => [
      emp.id,
      emp.name,
      emp.role,
      emp.department,
      emp.totalHours,
      emp.recoverableHours,
      emp.recoverableCost,
      `${emp.efficiencyScore}%`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `workforce_pulse_export_dept_${filters.department}_emp_${filters.employeeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform client-side search filtering on employee table rows
  const searchedEmployees = React.useMemo(() => {
    if (!searchVal) return filteredData.employees;
    const term = searchVal.toLowerCase();
    return filteredData.employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.role.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term)
    );
  }, [filteredData.employees, searchVal]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-250">
      {/* Top Navbar */}
      <Navbar
        onSearchChange={setSearchVal}
        onExportClick={handleExport}
        title="Workforce Pulse"
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* Filters Section */}
        <FiltersSection
          options={filterOptions}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* KPI Cards */}
        <KpiCards kpis={filteredData.kpis} />

        {/* Charts Section */}
        <ChartsSection
          timeByDepartment={filteredData.timeByDepartment}
          timeByApp={filteredData.timeByApp}
          timeByTaskCategory={filteredData.timeByTaskCategory}
          weeklyTrend={filteredData.weeklyTrend}
        />

        {/* Tables Section */}
        <div className="grid gap-6 xl:grid-cols-1">
          {/* Automation Priority Table */}
          <PriorityTable tasks={filteredData.automationTasks} />

          {/* Employee Table */}
          <EmployeeTable
            employees={searchedEmployees}
            onEmployeeClick={handleEmployeeClick}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Employee Detail Drawer */}
      <EmployeeDrawer
        employee={activeEmployeeDetail}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* AI Assistant Chat Widget */}
      <AiAssistant dataset={dataset} filteredData={filteredData} />
    </div>
  );
}
