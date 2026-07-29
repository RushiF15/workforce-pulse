/**
 * Shared primitives for the data layer.
 *
 * Nothing here knows about employees or activities specifically — this file
 * exists so every normalizer can report *why* it changed or rejected a value
 * without throwing. In an ingestion pipeline, throwing on bad data is almost
 * always wrong: one malformed row should never take down the dashboard.
 */

export type IssueSeverity = 'info' | 'warning' | 'error';

export type IssueEntity = 'employee' | 'activity' | 'dataset';

/**
 * Every code the pipeline can emit. Keeping this a closed union means the UI
 * (later milestones) can switch on it exhaustively.
 */
export type IssueCode =
  // --- structural / parsing ---
  | 'UNKNOWN_RECORD_SHAPE'
  | 'MALFORMED_ROW'
  | 'MISSING_REQUIRED_FIELD'
  // --- identity ---
  | 'INVALID_EMPLOYEE_ID'
  | 'UNKNOWN_EMPLOYEE_ID'
  | 'DUPLICATE_EMPLOYEE_RECORD'
  | 'CONFLICTING_EMPLOYEE_FIELD'
  // --- value quality ---
  | 'UNMAPPED_DEPARTMENT'
  | 'UNMAPPED_APP'
  | 'UNMAPPED_TASK_CATEGORY'
  | 'UNPARSEABLE_TIMESTAMP'
  | 'UNPARSEABLE_BOOLEAN'
  | 'MISSING_DURATION'
  | 'INVALID_DURATION'
  | 'IMPLAUSIBLE_DURATION'
  | 'MISSING_COMPENSATION'
  | 'ESTIMATED_COMPENSATION'
  | 'MISSING_WORKING_HOURS'
  | 'UNPARSEABLE_WORKING_HOURS'
  // --- cross-dataset consistency ---
  | 'DUPLICATE_ACTIVITY_ROW'
  | 'DEPARTMENT_MISMATCH'
  | 'NO_ACTIVITY_FOR_EMPLOYEE'
  | 'POST_TERMINATION_ACTIVITY'
  | 'SYNTHETIC_EMPLOYEE_CREATED';

export interface DataIssue {
  code: IssueCode;
  severity: IssueSeverity;
  entity: IssueEntity;
  /** Employee ID or activity ID, when the issue is attributable to one record. */
  entityId?: string | null;
  /** 0-based index in the source file, for tracing back to the raw data. */
  sourceIndex?: number;
  field?: string;
  rawValue?: unknown;
  message: string;
}

/**
 * Accumulates issues across the whole run. Passed by reference into every
 * normalizer so the pipeline ends with a single auditable log.
 */
export class IssueCollector {
  private readonly issues: DataIssue[] = [];

  add(issue: DataIssue): void {
    this.issues.push(issue);
  }

  all(): readonly DataIssue[] {
    return this.issues;
  }

  byCode(): Record<string, number> {
    return this.issues.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.code] = (acc[issue.code] ?? 0) + 1;
      return acc;
    }, {});
  }

  forEntity(entityId: string): DataIssue[] {
    return this.issues.filter((issue) => issue.entityId === entityId);
  }

  countBySeverity(severity: IssueSeverity): number {
    return this.issues.filter((issue) => issue.severity === severity).length;
  }
}

/** Result of normalizing a single scalar value. */
export interface NormalizedValue<T> {
  value: T;
  /** True when the input was absent/unparseable and a fallback was applied. */
  fallbackApplied: boolean;
}

export const ok = <T>(value: T): NormalizedValue<T> => ({ value, fallbackApplied: false });
export const fallback = <T>(value: T): NormalizedValue<T> => ({ value, fallbackApplied: true });
