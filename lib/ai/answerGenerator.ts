 import { Intent } from "./intentMatcher";
import type { WorkforceDataset } from "@/data-pipeline";
import { computeDashboardData } from "@/components/dashboard/dashboard-view";

export function generateAnswer(
  intent: Intent,
  filteredData: ReturnType<typeof computeDashboardData>,
  dataset: WorkforceDataset
): string {
  // Compute date range metrics for monthly scaling calculations
  const daysCount =
    dataset.dateRange.start && dataset.dateRange.end
      ? (new Date(dataset.dateRange.end).getTime() - new Date(dataset.dateRange.start).getTime()) /
        (1000 * 60 * 60 * 24)
      : 1;
  const scalingFactor = daysCount > 0 ? 30 / daysCount : 1;

  switch (intent) {
    case "department_most_time": {
      const depts = filteredData.timeByDepartment;
      if (depts.length === 0) {
        return "There are no department waste records found matching the current filter selection.";
      }
      const topDept = depts[0];
      let response = `Based on the active filters, the **${topDept.department}** department wastes the most time on repetitive work, with **${topDept.hours} hours** of recoverable time costing **₹${topDept.cost.toLocaleString()}** in direct labor leakages during this period.\n\nHere is the breakdown by department under current filters:\n\n`;
      
      response += "| Department | Wasted Hours | Estimated Cost Leakage |\n|---|---|---|\n";
      depts.forEach((d) => {
        response += `| ${d.department} | ${d.hours}h | ₹${d.cost.toLocaleString()} |\n`;
      });
      return response;
    }

    case "employee_most_repetitive": {
      const emps = [...filteredData.employees].sort((a, b) => b.recoverableHours - a.recoverableHours);
      if (emps.length === 0) {
        return "No employee records found matching the active filters.";
      }
      const topEmp = emps[0];
      const monthlySavings = Math.round(topEmp.recoverableCost * scalingFactor);
      
      let response = `The employee spending the most time on repetitive work under active filters is **${topEmp.name}** (**${topEmp.role}** in **${topEmp.department}**).\n\n**Individual Metrics:**\n- **Recoverable Waste:** ${topEmp.recoverableHours} hours\n- **Logged Time:** ${topEmp.totalHours} hours\n- **Direct Period Cost Leakage:** ₹${topEmp.recoverableCost.toLocaleString()}\n- **Estimated Monthly Savings potential:** ₹${monthlySavings.toLocaleString()}\n- **Process Efficiency:** ${topEmp.efficiencyScore}%\n\nThis employee is a strong candidate for desktop workflow automation or training support.`;
      return response;
    }

    case "top_automation": {
      const tasks = filteredData.automationTasks;
      if (tasks.length === 0) {
        return "No priority automation candidates were identified matching the active filters.";
      }
      const topTask = tasks[0];
      let response = `The highest ROI opportunity identified is automating **"${topTask.taskName}"**.\n\n**Opportunity Impact Details:**\n- **Wasted Time:** ${topTask.hours} hours\n- **Estimated Monthly Savings:** ₹${topTask.estimatedSavings.toLocaleString()}\n- **Impacted Team Members:** ${topTask.employeeCount} employees\n- **Priority Level:** ${topTask.priority}\n\nImplementing automation for this process should be prioritized as it yields the highest direct cost recovery.`;
      return response;
    }

    case "most_used_app": {
      const apps = filteredData.timeByApp;
      if (apps.length === 0) {
        return "No application usage metrics found under active filters.";
      }
      const topApp = apps[0];
      let response = `The application consuming the most employee time is **${topApp.appName}**, representing **${topApp.hours} hours** which accounts for **${topApp.percentage}%** of all tracked logs.\n\nHere is the application usage distribution:\n\n`;
      
      response += "| Application | Total Spent Hours | Percentage of Total Time |\n|---|---|---|\n";
      apps.forEach((a) => {
        response += `| ${a.appName} | ${a.hours}h | ${a.percentage}% |\n`;
      });
      return response;
    }

    case "finance_summary": {
      const depts = filteredData.timeByDepartment;
      const financeDept = depts.find((d) => d.department.toLowerCase().includes("finance"));
      if (!financeDept) {
        return "No Finance department insights or activity logs found under the current filter selection.";
      }
      const financeEmps = filteredData.employees.filter((e) => e.department.toLowerCase().includes("finance"));
      
      let response = `### Finance Department Insights\nUnder active filters, the Finance department has logged **${financeDept.hours} hours** of repetitive waste, representing a leakage of **₹${financeDept.cost.toLocaleString()}**.\n\n**Team Member Breakdown:**\n\n`;
      
      response += "| Employee | Role | Wasted Hours | Cost Leakage |\n|---|---|---|---|\n";
      financeEmps.forEach((e) => {
        response += `| ${e.name} | ${e.role} | ${e.recoverableHours}h | ₹${e.recoverableCost.toLocaleString()} |\n`;
      });
      return response;
    }

    case "sales_summary": {
      const depts = filteredData.timeByDepartment;
      const salesDept = depts.find((d) => d.department.toLowerCase().includes("sales"));
      if (!salesDept) {
        return "No Sales department insights or activity logs found under the current filter selection.";
      }
      const salesEmps = filteredData.employees.filter((e) => e.department.toLowerCase().includes("sales"));
      
      let response = `### Sales Department Insights\nUnder active filters, the Sales department has logged **${salesDept.hours} hours** of repetitive waste, representing a leakage of **₹${salesDept.cost.toLocaleString()}**.\n\n**Team Member Breakdown:**\n\n`;
      
      response += "| Employee | Role | Wasted Hours | Cost Leakage |\n|---|---|---|---|\n";
      salesEmps.forEach((e) => {
        response += `| ${e.name} | ${e.role} | ${e.recoverableHours}h | ₹${e.recoverableCost.toLocaleString()} |\n`;
      });
      return response;
    }

    case "recoverable_hours": {
      const totalHours = Math.round(filteredData.employees.reduce((sum, e) => sum + e.totalHours, 0) * 10) / 10;
      const recHours = filteredData.kpis.recoverableHours;
      const percentage = totalHours > 0 ? Math.round((recHours / totalHours) * 100) : 0;
      
      return `Under the current dashboard filters, the total estimated recoverable waste is **${recHours} hours**. This represents **${percentage}%** of the total tracked log time (**${totalHours} hours**). Automating these tasks could redirect this time toward core productive operations.`;
    }

    case "recoverable_cost": {
      const cost = filteredData.kpis.recoverableCost;
      const monthlySavings = Math.round(cost * scalingFactor);
      
      return `Under the current dashboard filters, the estimated direct cost leakage of repetitive tasks is **₹${cost.toLocaleString()}** for this logging period. On a normalized monthly basis, implementing automation workflows represents a recovery potential of **₹${monthlySavings.toLocaleString()} monthly**.`;
    }

    default:
      return "I'm sorry, but I encountered an unsupported intent when calculating this data.";
  }
}
