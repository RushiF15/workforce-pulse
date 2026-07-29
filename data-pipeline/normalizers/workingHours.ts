/**
 * Working hours normalization.
 *
 * Four shapes appear in employees.json:
 *   null                                                  (7 records)
 *   "9-18"        -> hours only, no minutes
 *   "9:30-18:30"  -> hours and minutes
 *   { start: "09:00", end: "18:00", timezone: "Asia/Kolkata" }
 *
 * Canonical target: zero-padded "HH:MM" start/end + explicit timezone +
 * a precomputed `expectedDailyMinutes`, which is what utilization math actually
 * needs. `isDefaulted` records whether the schedule came from the source or
 * from company policy, so the UI can distinguish "works 9-6" from "we assumed
 * 9-6". That distinction matters: 7 of 16 employees have no stated schedule.
 */

import { DATA_CONFIG } from '../config';

export interface WorkingHours {
  /** "HH:MM", 24-hour, zero-padded. */
  start: string;
  end: string;
  timezone: string;
  /** end - start in minutes; handles overnight shifts by wrapping past midnight. */
  expectedDailyMinutes: number;
  /** True when the source had no schedule and the policy default was applied. */
  isDefaulted: boolean;
}

interface RawWorkingHoursObject {
  start?: unknown;
  end?: unknown;
  timezone?: unknown;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** Accepts "9", "09", "9:30", "09:30". Returns null when not a valid time. */
function parseTimeToken(token: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(token.trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function toMinutes(time: { hour: number; minute: number }): number {
  return time.hour * 60 + time.minute;
}

function build(
  start: { hour: number; minute: number },
  end: { hour: number; minute: number },
  timezone: string,
  isDefaulted: boolean,
): WorkingHours {
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  // A shift ending before it starts is an overnight shift, not an error.
  const span = endMinutes > startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;

  return {
    start: `${pad(start.hour)}:${pad(start.minute)}`,
    end: `${pad(end.hour)}:${pad(end.minute)}`,
    timezone,
    expectedDailyMinutes: span,
    isDefaulted,
  };
}

export const DEFAULT_WORKING_HOURS: WorkingHours = build(
  parseTimeToken(DATA_CONFIG.defaultWorkingHours.start)!,
  parseTimeToken(DATA_CONFIG.defaultWorkingHours.end)!,
  DATA_CONFIG.defaultWorkingHours.timezone,
  true,
);

export interface WorkingHoursResult {
  workingHours: WorkingHours;
  /** 'parsed' | 'missing' (null in source) | 'unparseable' (present but bad). */
  outcome: 'parsed' | 'missing' | 'unparseable';
}

export function normalizeWorkingHours(raw: unknown): WorkingHoursResult {
  if (raw === null || raw === undefined || raw === '') {
    return { workingHours: DEFAULT_WORKING_HOURS, outcome: 'missing' };
  }

  if (typeof raw === 'object') {
    const obj = raw as RawWorkingHoursObject;
    const start = parseTimeToken(String(obj.start ?? ''));
    const end = parseTimeToken(String(obj.end ?? ''));
    const timezone = typeof obj.timezone === 'string' && obj.timezone.trim()
      ? obj.timezone.trim()
      : DATA_CONFIG.sourceTimezone;

    if (!start || !end) return { workingHours: DEFAULT_WORKING_HOURS, outcome: 'unparseable' };
    return { workingHours: build(start, end, timezone, false), outcome: 'parsed' };
  }

  // String form: "9-18", "9:30-18:30", tolerant of en-dashes and spaces.
  const text = String(raw).replace(/[–—]/g, '-').trim();
  const [startToken, endToken, ...rest] = text.split('-');
  if (!startToken || !endToken || rest.length > 0) {
    return { workingHours: DEFAULT_WORKING_HOURS, outcome: 'unparseable' };
  }

  const start = parseTimeToken(startToken);
  const end = parseTimeToken(endToken);
  if (!start || !end) return { workingHours: DEFAULT_WORKING_HOURS, outcome: 'unparseable' };

  return {
    workingHours: build(start, end, DATA_CONFIG.sourceTimezone, false),
    outcome: 'parsed',
  };
}
