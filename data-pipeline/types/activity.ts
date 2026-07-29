import type { AppCategory, AppId } from '../dictionaries/apps';
import type { Department } from '../dictionaries/departments';
import type { TaskCategoryId } from '../dictionaries/taskCategories';
import type { DurationQuality } from '../normalizers/primitives';

/** One row of activity_logs.csv, before any cleaning. All values are strings. */
export interface RawActivityRow {
  employee_id: string;
  department: string;
  timestamp: string;
  app_used: string;
  task_category: string;
  duration_minutes: string;
  is_repetitive: string;
}

export interface NormalizedActivity {
  /** Deterministic hash of the row's identity — stable across reloads. */
  activityId: string;
  /** null only when the row's employee_id was unparseable (e.g. "?"). */
  employeeId: string | null;

  /* --- time --- */
  timestampUtc: string;
  localDate: string;
  localTime: string;
  hourOfDay: number;
  weekday: number;
  isoWeek: string;

  /* --- app --- */
  appId: AppId;
  appLabel: string;
  appCategory: AppCategory;
  appRaw: string | null;

  /* --- task --- */
  taskCategoryId: TaskCategoryId;
  taskCategoryLabel: string;
  taskCategoryRaw: string | null;
  isAutomatableCategory: boolean;

  /* --- measures --- */
  /** null whenever durationQuality !== 'valid'. Never treat null as 0. */
  durationMinutes: number | null;
  durationQuality: DurationQuality;
  durationRaw: string | null;
  /** null means "the source did not say", NOT false. */
  isRepetitive: boolean | null;

  /* --- provenance --- */
  /** Department as claimed by the log row, before reconciliation with HR. */
  reportedDepartment: Department;
  /** True when no matching employee exists in the HR master. */
  isOrphan: boolean;
  /** 0-based row index in the source CSV, for traceability. */
  sourceRowIndex: number;
}
