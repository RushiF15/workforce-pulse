/**
 * Every business assumption the pipeline makes lives here — nowhere else.
 *
 * The rule: if a reviewer would ask "where did that number come from?", the
 * answer must be this file. Normalizers import constants; they never inline them.
 */

export const DATA_CONFIG = {
  /**
   * All source timestamps are naive local times from an India-based HRMS.
   * India has no DST, so a fixed offset is correct and avoids pulling in a
   * timezone database. If the company ever goes multi-region, replace this
   * with per-employee `workingHours.timezone` + a real tz library.
   */
  sourceTimezone: 'Asia/Kolkata',
  sourceUtcOffsetMinutes: 5 * 60 + 30,

  /** Fallback schedule when `working_hours` is null. */
  defaultWorkingHours: {
    start: '09:00',
    end: '18:00',
    timezone: 'Asia/Kolkata',
  },

  /**
   * Used to convert hourly rates into an annual CTC so every employee is
   * comparable on one axis. 8h/day x 250 working days = 2000 billable hours.
   * Any employee compensated this way is marked `isEstimated: true`.
   */
  hoursPerDay: 8,
  workingDaysPerYear: 250,

  /** 1 LPA = 1 lakh = 100,000 INR. */
  rupeesPerLakh: 100_000,

  duration: {
    /** Anything <= this is a data-entry error, not a real session. */
    minMinutes: 0,
    /** A single logged app session longer than this is not credible. */
    maxMinutes: 480,
    /**
     * Sentinel values the source system writes instead of NULL.
     * `999` appears 3x in the sample and is always suspicious.
     */
    sentinelValues: [999, 9999, -1],
  },

  /**
   * What to do with activity rows whose employee_id is not in the HR master.
   *  - 'placeholder': synthesize a minimal employee record so the activity is
   *                   still visible in the dashboard (recommended)
   *  - 'orphan':      keep the row but leave employeeId null
   *  - 'drop':        discard the row
   */
  unknownEmployeeStrategy: 'placeholder' as 'placeholder' | 'orphan' | 'drop',

  /** Exact-duplicate activity rows are collapsed to one. */
  dedupeActivities: true,
} as const;

export type DataConfig = typeof DATA_CONFIG;
