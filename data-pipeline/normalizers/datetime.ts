/**
 * Timestamp normalization.
 *
 * The CSV mixes four formats:
 *   1. 2025-10-08 13:46:09   (ISO-like, space separator, with seconds) - 317 rows
 *   2. 21/10/2025 14:44      (DD/MM/YYYY, no seconds)                  -  94 rows
 *   3. 2025-10-17T13:21:23   (ISO 8601, no offset)                     -  68 rows
 *   4. 2025-10-16 15:17      (ISO-like, no seconds)                    -  60 rows
 *
 * DD/MM vs MM/DD ambiguity: resolved, not assumed. In the slash-format rows the
 * first component ranges 6..24 while the second is always 10, so the format is
 * unambiguously DD/MM/YYYY. `parseTimestamp` still rejects a slash date whose
 * first component is > 12 AND second component is > 12 as unparseable.
 *
 * None of the four formats carries a timezone. All are naive Asia/Kolkata
 * local times, so we attach the fixed +05:30 offset from config and store UTC.
 * We also precompute local-calendar fields, because deriving "which day / which
 * hour did this happen in the employee's own timezone" from a UTC instant in
 * every chart later is both repetitive and easy to get wrong.
 */

import { DATA_CONFIG } from '../config';

export interface NormalizedTimestamp {
  /** Canonical instant, always UTC ISO-8601 with 'Z'. */
  timestampUtc: string;
  /** Local calendar date in the source timezone, YYYY-MM-DD. */
  localDate: string;
  /** Local wall-clock time, HH:MM. */
  localTime: string;
  /** 0-23 in the source timezone — for "when do people work" analysis. */
  hourOfDay: number;
  /** 1 = Monday ... 7 = Sunday, in the source timezone. */
  weekday: number;
  /** ISO week key, e.g. "2025-W42" — cheap bucketing key for trend views. */
  isoWeek: string;
}

const PATTERNS: Array<{ regex: RegExp; order: 'ymd' | 'dmy' }> = [
  // 2025-10-08 13:46:09 | 2025-10-17T13:21:23 | 2025-10-16 15:17
  { regex: /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/, order: 'ymd' },
  // 21/10/2025 14:44
  { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/, order: 'dmy' },
];

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function extractParts(raw: string): DateParts | null {
  for (const { regex, order } of PATTERNS) {
    const match = regex.exec(raw);
    if (!match) continue;

    const parts =
      order === 'ymd'
        ? {
            year: Number(match[1]),
            month: Number(match[2]),
            day: Number(match[3]),
            hour: Number(match[4]),
            minute: Number(match[5]),
            second: Number(match[6] ?? 0),
          }
        : {
            day: Number(match[1]),
            month: Number(match[2]),
            year: Number(match[3]),
            hour: Number(match[4]),
            minute: Number(match[5]),
            second: Number(match[6] ?? 0),
          };

    if (!isCalendarValid(parts)) return null;
    return parts;
  }
  return null;
}

function isCalendarValid({ year, month, day, hour, minute, second }: DateParts): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;

  // Reject impossible days (e.g. 31/02) by round-tripping through UTC.
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

function isoWeekOf(utcDate: Date): string {
  // ISO-8601 week: Thursday of the current week determines the year.
  const target = new Date(utcDate.getTime());
  const day = (target.getUTCDay() + 6) % 7; // Mon = 0
  target.setUTCDate(target.getUTCDate() - day + 3);
  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${isoYear}-W${pad(week)}`;
}

/**
 * Returns null when the value cannot be parsed. Callers log the failure and
 * drop or quarantine the row — a row without a valid time cannot be placed on
 * any timeline, so imputing one would be fabrication.
 */
export function normalizeTimestamp(value: unknown): NormalizedTimestamp | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const parts = extractParts(raw);
  if (!parts) return null;

  const offset = DATA_CONFIG.sourceUtcOffsetMinutes;
  const utcMillis =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) -
    offset * 60_000;
  const utcDate = new Date(utcMillis);
  if (Number.isNaN(utcDate.getTime())) return null;

  // Local fields come straight from the parsed parts — no re-derivation needed,
  // which keeps them immune to the host machine's own timezone.
  const localDate = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
  const jsWeekday = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day),
  ).getUTCDay(); // 0 = Sunday

  return {
    timestampUtc: utcDate.toISOString(),
    localDate,
    localTime: `${pad(parts.hour)}:${pad(parts.minute)}`,
    hourOfDay: parts.hour,
    weekday: jsWeekday === 0 ? 7 : jsWeekday,
    isoWeek: isoWeekOf(new Date(Date.UTC(parts.year, parts.month - 1, parts.day))),
  };
}

/** Normalizes a date-only field such as `terminated_on` to YYYY-MM-DD. */
export function normalizeDateOnly(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return raw;

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;

  const withTime = normalizeTimestamp(raw);
  return withTime ? withTime.localDate : null;
}
