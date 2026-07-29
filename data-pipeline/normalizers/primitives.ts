/**
 * Scalar normalizers. Pure, dependency-free, individually testable.
 * These are the lowest layer — entity normalizers compose them.
 */

import { DATA_CONFIG } from '../config';

/** Values the two source systems use to mean "nothing". */
const NULL_TOKENS = new Set(['', '-', '?', 'na', 'n/a', 'null', 'nil', 'none', 'undefined']);

export function isNullish(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return NULL_TOKENS.has(value.trim().toLowerCase());
  return false;
}

/** Trim + collapse internal whitespace. Returns null for null-ish input. */
export function cleanString(value: unknown): string | null {
  if (isNullish(value)) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text : null;
}

/* ------------------------------------------------------------------ *
 * Employee IDs                                                        *
 * ------------------------------------------------------------------ */

const EMPLOYEE_ID_PATTERN = /^E(\d{1,4})$/i;

/**
 * Canonical form: uppercase 'E' + zero-padded 3-digit number (E1 -> E001).
 * Returns null for '?', '', 'NA' and anything that does not match the scheme.
 * The caller decides what an unparseable ID means — this function never throws.
 */
export function normalizeEmployeeId(value: unknown): string | null {
  const text = cleanString(value);
  if (!text) return null;

  const match = EMPLOYEE_ID_PATTERN.exec(text.replace(/[\s_-]/g, ''));
  if (!match) return null;

  const numeric = Number.parseInt(match[1], 10);
  if (!Number.isFinite(numeric)) return null;

  return `E${String(numeric).padStart(3, '0')}`;
}

/* ------------------------------------------------------------------ *
 * Names                                                               *
 * ------------------------------------------------------------------ */

/**
 * Names in this dataset are placeholders ("Employee 001"), but real exports
 * arrive with double spaces, stray casing and trailing tabs. We normalize
 * formatting only — we never "correct" a person's name.
 */
export function normalizeName(value: unknown, employeeId: string | null): string {
  const text = cleanString(value);
  if (text) return text;
  return employeeId ? `Employee ${employeeId}` : 'Unknown Employee';
}

/* ------------------------------------------------------------------ *
 * Booleans                                                            *
 * ------------------------------------------------------------------ */

const TRUE_TOKENS = new Set(['true', 't', 'yes', 'y', '1']);
const FALSE_TOKENS = new Set(['false', 'f', 'no', 'n', '0']);

/**
 * `is_repetitive` arrives as 11 different tokens: yes/Yes/TRUE/true/1 and
 * no/No/FALSE/false/0, plus '-'.
 *
 * Critically, '-' maps to **null, not false**. Treating unknown as false would
 * silently understate repetitive work — the exact metric this dashboard exists
 * to measure.
 */
export function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  const text = cleanString(value);
  if (!text) return null;

  const token = text.toLowerCase();
  if (TRUE_TOKENS.has(token)) return true;
  if (FALSE_TOKENS.has(token)) return false;
  return null;
}

/* ------------------------------------------------------------------ *
 * Numbers                                                             *
 * ------------------------------------------------------------------ */

/** Tolerates "1,240,000", " 20.9 ", "₹590000". Returns null when not numeric. */
export function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = cleanString(value);
  if (!text) return null;

  const cleaned = text.replace(/[₹,\s]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Tenure must be a non-negative integer count of months. */
export function normalizeTenureMonths(value: unknown): number | null {
  const parsed = normalizeNumber(value);
  if (parsed === null) return null;
  if (parsed < 0) return null;
  return Math.round(parsed);
}

/* ------------------------------------------------------------------ *
 * Durations                                                           *
 * ------------------------------------------------------------------ */

export type DurationQuality = 'valid' | 'missing' | 'invalid' | 'implausible';

export interface NormalizedDuration {
  /** null whenever quality !== 'valid'. Aggregations must skip nulls. */
  minutes: number | null;
  quality: DurationQuality;
  raw: string | null;
}

/**
 * Duration rules, in order:
 *   empty / non-numeric        -> 'missing'      (3 rows in the sample)
 *   <= 0                       -> 'invalid'      (a -3 exists)
 *   sentinel (999) or > 480min -> 'implausible'  (3 rows of 999)
 *   otherwise                  -> 'valid', rounded to whole minutes
 *
 * We deliberately do NOT clamp implausible values to the max. Clamping invents
 * 480 minutes of work that never happened; nulling forces the metric layer to
 * exclude the row and report coverage honestly.
 */
export function normalizeDuration(value: unknown): NormalizedDuration {
  const raw = value === null || value === undefined ? null : String(value).trim();
  const parsed = normalizeNumber(value);

  if (parsed === null) return { minutes: null, quality: 'missing', raw };
  if (parsed <= DATA_CONFIG.duration.minMinutes) return { minutes: null, quality: 'invalid', raw };

  const isSentinel = (DATA_CONFIG.duration.sentinelValues as readonly number[]).includes(parsed);
  if (isSentinel || parsed > DATA_CONFIG.duration.maxMinutes) {
    return { minutes: null, quality: 'implausible', raw };
  }

  return { minutes: Math.round(parsed), quality: 'valid', raw };
}

/* ------------------------------------------------------------------ *
 * Hashing (for deterministic IDs / dedupe keys)                       *
 * ------------------------------------------------------------------ */

/**
 * FNV-1a. Not cryptographic — we only need a short, stable, collision-unlikely
 * key for identifying an activity row across reloads. Avoids a node:crypto
 * import so the module also runs in edge runtimes.
 */
export function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
