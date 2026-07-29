/**
 * Public surface of the data layer.
 * Everything else in the app should import from here, never from deep paths.
 */

export { DATA_CONFIG } from './config';
export type { DataConfig } from './config';

export {
  buildWorkforceDataset,
  getWorkforceDataset,
  clearDatasetCache,
  DEFAULT_PATHS,
} from './pipeline';
export type { DatasetPaths } from './pipeline';

export type {
  WorkforceDataset,
  EmployeeWithActivity,
  EmployeeActivitySummary,
  DatasetDiagnostics,
} from './types/dataset';
export type { NormalizedEmployee, EmploymentStatus, RawEmployee } from './types/employee';
export type { NormalizedActivity, RawActivityRow } from './types/activity';
export type { DataIssue, IssueCode, IssueSeverity } from './types/common';

export type { Department } from './dictionaries/departments';
export type { AppId, AppCategory } from './dictionaries/apps';
export type { TaskCategoryId } from './dictionaries/taskCategories';
export type { Seniority } from './dictionaries/roles';
export type { Compensation } from './normalizers/compensation';
export { costOfMinutes } from './normalizers/compensation';
export type { WorkingHours } from './normalizers/workingHours';

export { DEPARTMENTS } from './dictionaries/departments';
export { APP_DEFINITIONS, APP_IDS } from './dictionaries/apps';
export { TASK_CATEGORY_DEFINITIONS, TASK_CATEGORY_IDS } from './dictionaries/taskCategories';
