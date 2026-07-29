/**
 * The pipeline: the one function the rest of the app calls.
 *
 *   load -> normalize -> join -> WorkforceDataset
 *
 * `buildWorkforceDataset` is pure (text in, dataset out) so it can be unit
 * tested with fixture strings and no filesystem. `getWorkforceDataset` adds
 * file reading plus a process-level cache.
 */

import path from 'node:path';

import { IssueCollector } from './types/common';
import type { WorkforceDataset } from './types/dataset';
import { parseEmployeesJson } from './loaders/loadJson';
import { parseActivityCsv } from './loaders/loadCsv';
import { normalizeEmployees } from './normalizers/employee';
import { normalizeActivities } from './normalizers/activity';
import { joinDatasets } from './join/joinDatasets';
import { DATA_CONFIG } from './config';

export function buildWorkforceDataset(
  employeesJsonText: string,
  activityCsvText: string,
): WorkforceDataset {
  const issues = new IssueCollector();

  // 1. Parse
  const employeeFile = parseEmployeesJson(employeesJsonText);
  const activityFile = parseActivityCsv(activityCsvText);

  for (const rowIndex of activityFile.malformedRowIndexes) {
    issues.add({
      code: 'MALFORMED_ROW',
      severity: 'warning',
      entity: 'activity',
      sourceIndex: rowIndex,
      message: `CSV row ${rowIndex} had an unexpected column count.`,
    });
  }

  // 2. Normalize each side independently
  const employeeResult = normalizeEmployees(employeeFile.employees, issues);
  const activityResult = normalizeActivities(activityFile.rows, issues, {
    dedupe: DATA_CONFIG.dedupeActivities,
  });

  // 3. Join
  return joinDatasets({
    employees: employeeResult.employees,
    activities: activityResult.activities,
    issues,
    meta: {
      employeeRecordsRead: employeeResult.recordsRead,
      duplicateEmployeeRecordsMerged: employeeResult.duplicatesMerged,
      activityRowsRead: activityResult.rowsRead,
      duplicateActivityRowsDropped: activityResult.duplicatesDropped,
      unparseableTimestampRows: activityResult.rowsDropped,
    },
  });
}

export interface DatasetPaths {
  employeesJson: string;
  activityCsv: string;
}

export const DEFAULT_PATHS: DatasetPaths = {
  employeesJson: path.join(process.cwd(), 'data', 'employees.json'),
  activityCsv: path.join(process.cwd(), 'data', 'activity_logs.csv'),
};

let cached: WorkforceDataset | null = null;

/**
 * Server-side entry point.
 *
 * The cache is deliberate: the source files are static exports, so re-parsing
 * them on every request would burn CPU for no benefit. Pass `{ force: true }`
 * after replacing the files, or drop the cache entirely once the data moves
 * behind a real database or upload flow.
 */
export async function getWorkforceDataset(
  paths: DatasetPaths = DEFAULT_PATHS,
  options: { force?: boolean } = {},
): Promise<WorkforceDataset> {
  if (cached && !options.force) return cached;

  const { readFile } = await import('node:fs/promises');
  const [employeesJsonText, activityCsvText] = await Promise.all([
    readFile(paths.employeesJson, 'utf-8'),
    readFile(paths.activityCsv, 'utf-8'),
  ]);

  cached = buildWorkforceDataset(employeesJsonText, activityCsvText);
  return cached;
}

export function clearDatasetCache(): void {
  cached = null;
}
