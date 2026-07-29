import type { DataIssue } from './common';
import type { NormalizedActivity } from './activity';
import type { NormalizedEmployee } from './employee';

/**
 * Lightweight per-employee roll-up produced by the join.
 *
 * This is intentionally *not* the metrics layer — no scores, no rates, no
 * benchmarks. It only answers questions the join itself already had to
 * compute (does this employee have activity, over what window). Anything
 * analytical belongs in milestone 2.
 */
export interface EmployeeActivitySummary {
  employeeId: string;
  activityCount: number;
  /** Sum of valid durations only. Rows with null duration are excluded. */
  totalDurationMinutes: number;
  /** How many rows contributed to the sum — the honest denominator. */
  durationCoverage: {
    valid: number;
    missing: number;
    invalid: number;
    implausible: number;
  };
  repetitiveMinutes: number;
  /** Rows where is_repetitive was blank — excluded from repetitiveMinutes. */
  unknownRepetitiveCount: number;
  firstActivityUtc: string | null;
  lastActivityUtc: string | null;
  activeDays: number;
  hasActivity: boolean;
}

export interface EmployeeWithActivity {
  employee: NormalizedEmployee;
  activities: NormalizedActivity[];
  summary: EmployeeActivitySummary;
}

export interface DatasetDiagnostics {
  employeeRecordsRead: number;
  employeesAfterMerge: number;
  duplicateEmployeeRecordsMerged: number;
  syntheticEmployeesCreated: number;
  employeesWithoutActivity: string[];

  activityRowsRead: number;
  activityRowsKept: number;
  duplicateActivityRowsDropped: number;
  orphanActivityRows: number;
  unparseableTimestampRows: number;
  unmappedApps: string[];
  unmappedTaskCategories: string[];

  issues: readonly DataIssue[];
  issueCountsByCode: Record<string, number>;
}

export interface WorkforceDataset {
  employees: NormalizedEmployee[];
  activities: NormalizedActivity[];
  /** Rows that could not be attributed to any employee. */
  orphanActivities: NormalizedActivity[];
  /** Keyed by employeeId — the primary structure the app should read from. */
  byEmployee: Record<string, EmployeeWithActivity>;
  diagnostics: DatasetDiagnostics;
  /** Observed activity window, useful for date pickers later. */
  dateRange: { start: string | null; end: string | null };
}
