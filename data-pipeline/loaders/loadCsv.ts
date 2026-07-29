/**
 * CSV loading for activity_logs.csv.
 *
 * Same split as the JSON loader: a pure parse function plus a thin filesystem
 * wrapper. Header validation happens here so a renamed column fails loudly at
 * ingestion rather than showing up as an empty chart three milestones later.
 */

import { parseCsv } from './csvParser';
import { DataLoadError } from './loadJson';
import type { RawActivityRow } from '../types/activity';

export const REQUIRED_ACTIVITY_HEADERS = [
  'employee_id',
  'department',
  'timestamp',
  'app_used',
  'task_category',
  'duration_minutes',
  'is_repetitive',
] as const;

export interface ActivityCsvResult {
  rows: RawActivityRow[];
  malformedRowIndexes: number[];
}

export function parseActivityCsv(text: string): ActivityCsvResult {
  const { headers, rows, malformedRowIndexes } = parseCsv(text);

  const missing = REQUIRED_ACTIVITY_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new DataLoadError(`activity_logs.csv is missing required column(s): ${missing.join(', ')}`);
  }

  return {
    rows: rows as unknown as RawActivityRow[],
    malformedRowIndexes,
  };
}

/** Server-side only. */
export async function loadActivityFile(filePath: string): Promise<ActivityCsvResult> {
  const { readFile } = await import('node:fs/promises');
  try {
    const text = await readFile(filePath, 'utf-8');
    return parseActivityCsv(text);
  } catch (error) {
    if (error instanceof DataLoadError) throw error;
    throw new DataLoadError(`Unable to read activity file at ${filePath}`, error);
  }
}
