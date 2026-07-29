/**
 * Compensation normalization.
 *
 * The HRMS export expresses pay four different ways:
 *   salary_LPA: 20.9                       -> lakhs per annum (x100,000)
 *   annual_ctc_inr: 2880000                -> already annual rupees
 *   hourly_rate_inr: 695.0                 -> needs an hours assumption
 *   meta.compensation: { currency, annual } -> nested, annual rupees
 *
 * Canonical target: `annualCtcInr` in whole rupees. Everything else (monthly,
 * hourly) is derived from it so the three never drift apart.
 *
 * The hourly -> annual conversion is the one place we invent information, so
 * the result is tagged `isEstimated: true` and the assumption
 * (8h/day x 250 days = 2000h/yr) lives in config.ts, not here.
 */

import { DATA_CONFIG } from '../config';
import { normalizeNumber } from './primitives';

export type CompensationSource =
  | 'salary_lpa'
  | 'annual_ctc_inr'
  | 'hourly_rate_inr'
  | 'nested_meta'
  | 'unknown';

export interface Compensation {
  currency: 'INR';
  /** Canonical figure. null when the source had no usable value. */
  annualCtcInr: number | null;
  monthlyCtcInr: number | null;
  hourlyRateInr: number | null;
  /** Which raw field this was derived from — keeps the pipeline auditable. */
  source: CompensationSource;
  /** True when an assumption (working hours per year) was required. */
  isEstimated: boolean;
}

export const UNKNOWN_COMPENSATION: Compensation = {
  currency: 'INR',
  annualCtcInr: null,
  monthlyCtcInr: null,
  hourlyRateInr: null,
  source: 'unknown',
  isEstimated: false,
};

const ANNUAL_HOURS = DATA_CONFIG.hoursPerDay * DATA_CONFIG.workingDaysPerYear;

function build(annualCtcInr: number, source: CompensationSource, isEstimated: boolean): Compensation {
  const annual = Math.round(annualCtcInr);
  return {
    currency: 'INR',
    annualCtcInr: annual,
    monthlyCtcInr: Math.round(annual / 12),
    hourlyRateInr: Math.round((annual / ANNUAL_HOURS) * 100) / 100,
    source,
    isEstimated,
  };
}

export interface CompensationInput {
  salaryLpa?: unknown;
  annualCtcInr?: unknown;
  hourlyRateInr?: unknown;
  nestedAnnual?: unknown;
  nestedCurrency?: unknown;
}

/**
 * Precedence is deliberate: an explicitly stated annual figure beats a derived
 * one, and a derived one beats an estimated one. If two fields are present the
 * more authoritative wins rather than the first encountered.
 */
export function normalizeCompensation(input: CompensationInput): Compensation {
  const nestedAnnual = normalizeNumber(input.nestedAnnual);
  if (nestedAnnual !== null && nestedAnnual > 0) {
    const currency = String(input.nestedCurrency ?? 'INR').toUpperCase();
    // Only INR appears in this export; a non-INR record would need an FX rate,
    // which we refuse to guess — surface it as unknown instead.
    if (currency === 'INR') return build(nestedAnnual, 'nested_meta', false);
    return { ...UNKNOWN_COMPENSATION, source: 'nested_meta' };
  }

  const annual = normalizeNumber(input.annualCtcInr);
  if (annual !== null && annual > 0) return build(annual, 'annual_ctc_inr', false);

  const lpa = normalizeNumber(input.salaryLpa);
  if (lpa !== null && lpa > 0) {
    return build(lpa * DATA_CONFIG.rupeesPerLakh, 'salary_lpa', false);
  }

  const hourly = normalizeNumber(input.hourlyRateInr);
  if (hourly !== null && hourly > 0) {
    return build(hourly * ANNUAL_HOURS, 'hourly_rate_inr', true);
  }

  return UNKNOWN_COMPENSATION;
}

/**
 * Cost of a block of activity time. Returns null rather than 0 when either
 * input is unknown — a missing rate must not silently price work at zero.
 */
export function costOfMinutes(compensation: Compensation, minutes: number | null): number | null {
  if (compensation.hourlyRateInr === null || minutes === null) return null;
  return Math.round((compensation.hourlyRateInr * (minutes / 60)) * 100) / 100;
}
