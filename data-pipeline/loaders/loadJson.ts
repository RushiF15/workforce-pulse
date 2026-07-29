/**
 * JSON loading.
 *
 * Split into two functions on purpose:
 *   parseEmployeesJson(text) — pure, runs anywhere, trivially unit-testable
 *   loadEmployeesFile(path)  — the only part that touches the filesystem
 *
 * In Next.js, call `loadEmployeesFile` from a Server Component, a route handler
 * or `generateStaticParams` — never from a client component. `node:fs/promises`
 * is imported dynamically so this module can be bundled without dragging Node
 * built-ins into a client graph.
 */

import type { RawEmployee, RawEmployeeFile } from '../types/employee';

export class DataLoadError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DataLoadError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates only the envelope — that we have an `employees` array of objects.
 * Per-record shape detection happens in the normalizer, because a single bad
 * record must not invalidate the other 15.
 */
export function parseEmployeesJson(text: string): RawEmployeeFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new DataLoadError('employees.json is not valid JSON', error);
  }

  if (!isRecord(parsed)) {
    throw new DataLoadError('employees.json must contain a top-level object');
  }
  if (!Array.isArray(parsed.employees)) {
    throw new DataLoadError('employees.json is missing the `employees` array');
  }

  const employees = parsed.employees.filter(isRecord) as unknown as RawEmployee[];

  return {
    generated_at: typeof parsed.generated_at === 'string' ? parsed.generated_at : undefined,
    source_system: typeof parsed.source_system === 'string' ? parsed.source_system : undefined,
    currency_default: typeof parsed.currency_default === 'string' ? parsed.currency_default : undefined,
    notes: typeof parsed.notes === 'string' ? parsed.notes : undefined,
    employees,
  };
}

/** Server-side only. */
export async function loadEmployeesFile(filePath: string): Promise<RawEmployeeFile> {
  const { readFile } = await import('node:fs/promises');
  try {
    const text = await readFile(filePath, 'utf-8');
    return parseEmployeesJson(text);
  } catch (error) {
    if (error instanceof DataLoadError) throw error;
    throw new DataLoadError(`Unable to read employees file at ${filePath}`, error);
  }
}
