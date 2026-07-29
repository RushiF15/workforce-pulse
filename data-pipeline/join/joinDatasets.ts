/**
 * Joining employees to activities.
 *
 * The single most important decision here: this is a LEFT JOIN from employees.
 * An inner join would silently delete E099, who has a salary and a role but no
 * logged activity — and "an employee with zero recorded activity" is a finding,
 * not a row to discard.
 *
 * The join also performs three reconciliations that only make sense once both
 * sides are present:
 *   - unknown employee IDs   -> synthesize or orphan, per config
 *   - department disagreement-> HR master wins, disagreement is logged
 *   - post-termination activity -> flagged (E010 has 3 such rows)
 */

import { DATA_CONFIG } from '../config';
import { IssueCollector } from '../types/common';
import type { NormalizedActivity } from '../types/activity';
import type { NormalizedEmployee } from '../types/employee';
import type {
  EmployeeActivitySummary,
  EmployeeWithActivity,
  WorkforceDataset,
} from '../types/dataset';
import { createSyntheticEmployee } from '../normalizers/employee';

function emptySummary(employeeId: string): EmployeeActivitySummary {
  return {
    employeeId,
    activityCount: 0,
    totalDurationMinutes: 0,
    durationCoverage: { valid: 0, missing: 0, invalid: 0, implausible: 0 },
    repetitiveMinutes: 0,
    unknownRepetitiveCount: 0,
    firstActivityUtc: null,
    lastActivityUtc: null,
    activeDays: 0,
    hasActivity: false,
  };
}

function summarize(employeeId: string, activities: NormalizedActivity[]): EmployeeActivitySummary {
  const summary = emptySummary(employeeId);
  if (activities.length === 0) return summary;

  const days = new Set<string>();

  for (const activity of activities) {
    summary.activityCount += 1;
    summary.durationCoverage[activity.durationQuality] += 1;
    days.add(activity.localDate);

    if (activity.durationMinutes !== null) {
      summary.totalDurationMinutes += activity.durationMinutes;
      if (activity.isRepetitive === true) {
        summary.repetitiveMinutes += activity.durationMinutes;
      }
    }
    if (activity.isRepetitive === null) summary.unknownRepetitiveCount += 1;
  }

  // Activities arrive pre-sorted by timestamp from the normalizer.
  summary.firstActivityUtc = activities[0].timestampUtc;
  summary.lastActivityUtc = activities[activities.length - 1].timestampUtc;
  summary.activeDays = days.size;
  summary.hasActivity = true;

  return summary;
}

export interface JoinInput {
  employees: NormalizedEmployee[];
  activities: NormalizedActivity[];
  issues: IssueCollector;
  meta: {
    employeeRecordsRead: number;
    duplicateEmployeeRecordsMerged: number;
    activityRowsRead: number;
    duplicateActivityRowsDropped: number;
    unparseableTimestampRows: number;
  };
}

export function joinDatasets({
  employees,
  activities,
  issues,
  meta,
}: JoinInput): WorkforceDataset {
  const employeeById = new Map(employees.map((employee) => [employee.employeeId, employee]));
  const activitiesByEmployee = new Map<string, NormalizedActivity[]>();
  const orphanActivities: NormalizedActivity[] = [];
  const syntheticIds = new Set<string>();
  const keptActivities: NormalizedActivity[] = [];

  /* --- pass 1: attribute each activity to an employee --- */
  for (const activity of activities) {
    if (activity.employeeId === null) {
      // No usable ID at all (the "?" rows) — never inventable, always orphaned.
      orphanActivities.push(activity);
      keptActivities.push(activity);
      continue;
    }

    let employee = employeeById.get(activity.employeeId);

    if (!employee) {
      if (DATA_CONFIG.unknownEmployeeStrategy === 'drop') {
        issues.add({
          code: 'UNKNOWN_EMPLOYEE_ID',
          severity: 'warning',
          entity: 'activity',
          entityId: activity.employeeId,
          sourceIndex: activity.sourceRowIndex,
          message: `${activity.employeeId} is not in the HR master; row dropped per configuration.`,
        });
        continue;
      }

      if (DATA_CONFIG.unknownEmployeeStrategy === 'orphan') {
        orphanActivities.push({ ...activity, isOrphan: true });
        keptActivities.push({ ...activity, isOrphan: true });
        continue;
      }

      // 'placeholder' — synthesize once, using the department the log reports.
      if (!syntheticIds.has(activity.employeeId)) {
        syntheticIds.add(activity.employeeId);
        employee = createSyntheticEmployee(activity.employeeId, activity.reportedDepartment);
        employeeById.set(employee.employeeId, employee);
        issues.add({
          code: 'SYNTHETIC_EMPLOYEE_CREATED',
          severity: 'warning',
          entity: 'employee',
          entityId: activity.employeeId,
          message: `${activity.employeeId} appears in activity logs but not in the HR master; a placeholder record was created. HR data needs backfilling.`,
        });
      }
      employee = employeeById.get(activity.employeeId)!;
    }

    /* --- reconciliation checks against the master record --- */
    if (
      !employee.isSynthetic &&
      activity.reportedDepartment !== 'Unknown' &&
      activity.reportedDepartment !== employee.department
    ) {
      issues.add({
        code: 'DEPARTMENT_MISMATCH',
        severity: 'warning',
        entity: 'activity',
        entityId: activity.employeeId,
        sourceIndex: activity.sourceRowIndex,
        field: 'department',
        rawValue: { log: activity.reportedDepartment, master: employee.department },
        message: `Activity row claims ${activity.reportedDepartment} but HR master says ${employee.department}. HR master wins.`,
      });
    }

    if (
      employee.status === 'terminated' &&
      employee.terminatedOn !== null &&
      activity.localDate > employee.terminatedOn
    ) {
      issues.add({
        code: 'POST_TERMINATION_ACTIVITY',
        severity: 'warning',
        entity: 'activity',
        entityId: activity.employeeId,
        sourceIndex: activity.sourceRowIndex,
        message: `Activity on ${activity.localDate} post-dates ${employee.employeeId}'s termination (${employee.terminatedOn}) — check offboarding or log accuracy.`,
      });
    }

    const bucket = activitiesByEmployee.get(activity.employeeId);
    if (bucket) bucket.push(activity);
    else activitiesByEmployee.set(activity.employeeId, [activity]);

    keptActivities.push(activity);
  }

  /* --- pass 2: build the left-joined index --- */
  const byEmployee: Record<string, EmployeeWithActivity> = {};
  const employeesWithoutActivity: string[] = [];

  const allEmployees = Array.from(employeeById.values()).sort((a, b) =>
    a.employeeId.localeCompare(b.employeeId),
  );

  for (const employee of allEmployees) {
    const employeeActivities = activitiesByEmployee.get(employee.employeeId) ?? [];

    if (employeeActivities.length === 0) {
      employeesWithoutActivity.push(employee.employeeId);
      issues.add({
        code: 'NO_ACTIVITY_FOR_EMPLOYEE',
        severity: 'info',
        entity: 'employee',
        entityId: employee.employeeId,
        message: `${employee.employeeId} has no activity rows in the reporting window; shown with zeroed metrics, not omitted.`,
      });
    }

    byEmployee[employee.employeeId] = {
      employee,
      activities: employeeActivities,
      summary: summarize(employee.employeeId, employeeActivities),
    };
  }

  /* --- diagnostics --- */
  const unmappedApps = Array.from(
    new Set(
      issues
        .all()
        .filter((issue) => issue.code === 'UNMAPPED_APP')
        .map((issue) => String(issue.rawValue)),
    ),
  );
  const unmappedTaskCategories = Array.from(
    new Set(
      issues
        .all()
        .filter((issue) => issue.code === 'UNMAPPED_TASK_CATEGORY')
        .map((issue) => String(issue.rawValue)),
    ),
  );

  const sorted = keptActivities.map((activity) => activity.timestampUtc).sort();

  return {
    employees: allEmployees,
    activities: keptActivities,
    orphanActivities,
    byEmployee,
    dateRange: {
      start: sorted[0] ?? null,
      end: sorted[sorted.length - 1] ?? null,
    },
    diagnostics: {
      employeeRecordsRead: meta.employeeRecordsRead,
      employeesAfterMerge: employees.length,
      duplicateEmployeeRecordsMerged: meta.duplicateEmployeeRecordsMerged,
      syntheticEmployeesCreated: syntheticIds.size,
      employeesWithoutActivity,
      activityRowsRead: meta.activityRowsRead,
      activityRowsKept: keptActivities.length,
      duplicateActivityRowsDropped: meta.duplicateActivityRowsDropped,
      orphanActivityRows: orphanActivities.length,
      unparseableTimestampRows: meta.unparseableTimestampRows,
      unmappedApps,
      unmappedTaskCategories,
      issues: issues.all(),
      issueCountsByCode: issues.byCode(),
    },
  };
}
