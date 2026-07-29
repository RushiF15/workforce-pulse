export interface DashboardKPIs {
  recoverableHours: number;
  recoverableCost: number;
  totalEmployees: number;
  totalActivities: number;
}

export interface FilterState {
  department: string;
  employeeId: string;
  dateRange: string;
  taskCategory: string;
}

export interface FilterOptions {
  departments: string[];
  employees: { id: string; name: string; department: string }[];
  dateRanges: { label: string; start: string; end: string }[];
  taskCategories: string[];
}

export interface TimeByDepartmentData {
  department: string;
  hours: number;
  cost: number;
}

export interface TimeByAppData {
  appName: string;
  hours: number;
  percentage: number;
}

export interface TimeByTaskCategoryData {
  category: string;
  hours: number;
}

export interface WeeklyTrendData {
  week: string;
  productiveHours: number;
  recoverableHours: number;
}

export interface AutomationTask {
  rank: number;
  taskName: string;
  hours: number;
  employeeCount: number;
  estimatedSavings: number;
  priority: "High" | "Medium" | "Low";
}

export interface EmployeeSummary {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  totalHours: number;
  recoverableHours: number;
  recoverableCost: number;
  efficiencyScore: number;
}

export interface EmployeeDetail {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatarUrl?: string;
  kpis: {
    recoverableHours: number;
    recoverableCost: number;
    totalActivities: number;
  };
  activitySummary: { appName: string; hours: number }[];
  topRepetitiveTasks: { taskName: string; hours: number; frequency: number }[];
  weeklyTrend: { week: string; hours: number }[];
}

export interface DashboardData {
  kpis: DashboardKPIs;
  filters: FilterOptions;
  timeByDepartment: TimeByDepartmentData[];
  timeByApp: TimeByAppData[];
  timeByTaskCategory: TimeByTaskCategoryData[];
  weeklyTrend: WeeklyTrendData[];
  automationTasks: AutomationTask[];
  employees: EmployeeSummary[];
}
