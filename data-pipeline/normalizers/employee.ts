/**
 * Employee normalization: four raw shapes in, one canonical shape out.
 *
 * Two responsibilities, kept separate:
 *   1. `normalizeEmployeeRecord` — shape detection + field mapping for ONE record
 *   2. `normalizeEmployees`      — collection-level concerns: dedupe and merge
 *
 * Keeping them apart matters because the duplicate-resolution policy is a
 * business rule that will change; the field mapping is mechanical and will not.
 */

import { IssueCollector } from '../types/common';
import type { NormalizedEmployee, RawEmployee, EmploymentStatus } from '../types/employee';
import { lookupDepartment } from '../dictionaries/departments';
import { deriveSeniority, normalizeRole } from '../dictionaries/roles';
import { normalizeCompensation, UNKNOWN_COMPENSATION } from './compensation';
import { normalizeDateOnly } from './datetime';
import { cleanString, normalizeEmployeeId, normalizeName, normalizeTenureMonths } from './primitives';
import { DEFAULT_WORKING_HOURS, normalizeWorkingHours } from './workingHours';

type Shape = 'legacy' | 'modern' | 'nested';

/**
 * Duck-typing beats a discriminator field here because the source has none.
 * Order matters: `meta` is checked before flat snake_case, since nested records
 * also carry `employee_id`.
 */
function detectShape(record: Record<string, unknown>): Shape | null {
  if ('meta' in record && typeof record.meta === 'object' && record.meta !== null) return 'nested';
  if ('employee_id' in record) return 'modern';
  if ('EmployeeID' in record) return 'legacy';
  return null;
}

/** Flattens any of the three shapes into one intermediate bag of raw values. */
interface FlatRaw {
  id: unknown;
  name: unknown;
  department: unknown;
  role: unknown;
  salaryLpa: unknown;
  annualCtcInr: unknown;
  hourlyRateInr: unknown;
  nestedAnnual: unknown;
  nestedCurrency: unknown;
  tenureMonths: unknown;
  workingHours: unknown;
  status: unknown;
  terminatedOn: unknown;
}

function flatten(record: Record<string, unknown>, shape: Shape): FlatRaw {
  if (shape === 'legacy') {
    return {
      id: record.EmployeeID,
      name: record.Name,
      department: record.Dept,
      role: record.Role,
      salaryLpa: record.salary_LPA,
      annualCtcInr: undefined,
      hourlyRateInr: undefined,
      nestedAnnual: undefined,
      nestedCurrency: undefined,
      tenureMonths: record.tenureMonths,
      workingHours: record.workingHours,
      status: record.Status,
      terminatedOn: record.terminated_on,
    };
  }

  if (shape === 'nested') {
    const meta = (record.meta ?? {}) as Record<string, unknown>;
    const compensation = (meta.compensation ?? {}) as Record<string, unknown>;
    return {
      id: record.employee_id,
      name: record.name,
      department: record.department,
      role: meta.role,
      salaryLpa: undefined,
      annualCtcInr: undefined,
      hourlyRateInr: undefined,
      nestedAnnual: compensation.annual,
      nestedCurrency: compensation.currency,
      tenureMonths: meta.tenure_months,
      workingHours: meta.working_hours,
      status: record.status,
      terminatedOn: record.terminated_on,
    };
  }

  return {
    id: record.employee_id,
    name: record.name,
    department: record.department,
    role: record.role,
    salaryLpa: undefined,
    annualCtcInr: record.annual_ctc_inr,
    hourlyRateInr: record.hourly_rate_inr,
    nestedAnnual: undefined,
    nestedCurrency: undefined,
    tenureMonths: record.tenure_months,
    workingHours: record.working_hours,
    status: record.status,
    terminatedOn: record.terminated_on,
  };
}

function normalizeStatus(value: unknown): EmploymentStatus {
  const text = cleanString(value)?.toLowerCase();
  if (!text) return 'unknown';
  if (['active', 'employed', 'working'].includes(text)) return 'active';
  if (['terminated', 'exited', 'resigned', 'inactive'].includes(text)) return 'terminated';
  return 'unknown';
}

/**
 * Share of the seven business-meaningful fields that carry real source data.
 * Used to pick a winner when the same employee appears twice.
 */
function scoreCompleteness(employee: NormalizedEmployee): number {
  const checks = [
    employee.role !== null,
    employee.department !== 'Unknown',
    employee.compensation.annualCtcInr !== null,
    employee.compensation.isEstimated === false,
    employee.tenureMonths !== null,
    employee.workingHours.isDefaulted === false,
    employee.status !== 'unknown',
  ];
  return checks.filter(Boolean).length / checks.length;
}

export function normalizeEmployeeRecord(
  raw: RawEmployee,
  sourceIndex: number,
  issues: IssueCollector,
): NormalizedEmployee | null {
  const record = raw as unknown as Record<string, unknown>;
  const shape = detectShape(record);

  if (!shape) {
    issues.add({
      code: 'UNKNOWN_RECORD_SHAPE',
      severity: 'error',
      entity: 'employee',
      sourceIndex,
      rawValue: record,
      message: `Employee record at index ${sourceIndex} matches no known schema shape and was skipped.`,
    });
    return null;
  }

  const flat = flatten(record, shape);
  const employeeId = normalizeEmployeeId(flat.id);

  if (!employeeId) {
    issues.add({
      code: 'INVALID_EMPLOYEE_ID',
      severity: 'error',
      entity: 'employee',
      sourceIndex,
      field: 'employee_id',
      rawValue: flat.id,
      message: `Employee record at index ${sourceIndex} has an unusable ID and was skipped.`,
    });
    return null;
  }

  const department = lookupDepartment(cleanString(flat.department));
  if (!department) {
    issues.add({
      code: 'UNMAPPED_DEPARTMENT',
      severity: 'warning',
      entity: 'employee',
      entityId: employeeId,
      sourceIndex,
      field: 'department',
      rawValue: flat.department,
      message: `Department "${String(flat.department)}" is not in the canonical list.`,
    });
  }

  const roleRaw = cleanString(flat.role);
  const role = normalizeRole(roleRaw);

  const compensation = normalizeCompensation({
    salaryLpa: flat.salaryLpa,
    annualCtcInr: flat.annualCtcInr,
    hourlyRateInr: flat.hourlyRateInr,
    nestedAnnual: flat.nestedAnnual,
    nestedCurrency: flat.nestedCurrency,
  });

  if (compensation.annualCtcInr === null) {
    issues.add({
      code: 'MISSING_COMPENSATION',
      severity: 'warning',
      entity: 'employee',
      entityId: employeeId,
      sourceIndex,
      message: `No usable compensation found; cost-based metrics will exclude ${employeeId}.`,
    });
  } else if (compensation.isEstimated) {
    issues.add({
      code: 'ESTIMATED_COMPENSATION',
      severity: 'info',
      entity: 'employee',
      entityId: employeeId,
      sourceIndex,
      field: 'hourly_rate_inr',
      message: `Annual CTC for ${employeeId} was estimated from an hourly rate.`,
    });
  }

  const hours = normalizeWorkingHours(flat.workingHours);
  if (hours.outcome !== 'parsed') {
    issues.add({
      code: hours.outcome === 'missing' ? 'MISSING_WORKING_HOURS' : 'UNPARSEABLE_WORKING_HOURS',
      severity: hours.outcome === 'missing' ? 'info' : 'warning',
      entity: 'employee',
      entityId: employeeId,
      sourceIndex,
      field: 'working_hours',
      rawValue: flat.workingHours,
      message: `Working hours for ${employeeId} fell back to the company default schedule.`,
    });
  }

  const employee: NormalizedEmployee = {
    employeeId,
    displayName: normalizeName(flat.name, employeeId),
    department: department ?? 'Unknown',
    role,
    roleRaw,
    seniority: deriveSeniority(role),
    compensation,
    tenureMonths: normalizeTenureMonths(flat.tenureMonths),
    workingHours: hours.workingHours,
    status: normalizeStatus(flat.status),
    terminatedOn: normalizeDateOnly(flat.terminatedOn),
    sourceShape: shape,
    sourceRecordCount: 1,
    isSynthetic: false,
    completeness: 0,
  };

  employee.completeness = scoreCompleteness(employee);
  return employee;
}

/* ------------------------------------------------------------------ *
 * Duplicate resolution                                                *
 * ------------------------------------------------------------------ */

/**
 * Merge policy for two records sharing an employeeId (E007 in this dataset:
 * "Account Executive @ 14 LPA, 40 months" vs "Senior Account Executive @
 * 24,00,000, 28 months").
 *
 * We do NOT average, and we do NOT take the last record — both would be
 * arbitrary. Instead, deterministic precedence:
 *   1. an `active` record beats a non-active one
 *   2. higher completeness wins
 *   3. the newer schema shape wins (nested > modern > legacy)
 *   4. earlier source index wins (stable, reproducible output)
 *
 * The loser then back-fills any field the winner left null, and every genuine
 * field disagreement is logged as CONFLICTING_EMPLOYEE_FIELD for HR to resolve
 * at source. Silent merging without a log is how bad master data becomes
 * permanent.
 */
const SHAPE_RANK: Record<NormalizedEmployee['sourceShape'], number> = {
  nested: 3,
  modern: 2,
  legacy: 1,
  synthetic: 0,
};

function pickWinner(a: NormalizedEmployee, b: NormalizedEmployee): [NormalizedEmployee, NormalizedEmployee] {
  const aActive = a.status === 'active' ? 1 : 0;
  const bActive = b.status === 'active' ? 1 : 0;
  if (aActive !== bActive) return aActive > bActive ? [a, b] : [b, a];
  if (a.completeness !== b.completeness) return a.completeness > b.completeness ? [a, b] : [b, a];
  if (SHAPE_RANK[a.sourceShape] !== SHAPE_RANK[b.sourceShape]) {
    return SHAPE_RANK[a.sourceShape] > SHAPE_RANK[b.sourceShape] ? [a, b] : [b, a];
  }
  return [a, b];
}

function mergeEmployees(
  a: NormalizedEmployee,
  b: NormalizedEmployee,
  issues: IssueCollector,
): NormalizedEmployee {
  const [winner, loser] = pickWinner(a, b);

  const merged: NormalizedEmployee = {
    ...winner,
    sourceRecordCount: a.sourceRecordCount + b.sourceRecordCount,
  };

  // Back-fill nullable scalars the winner is missing. Written out explicitly
  // rather than looped, so the compiler checks every assignment.
  if (merged.role === null && loser.role !== null) {
    merged.role = loser.role;
    merged.roleRaw = loser.roleRaw;
    merged.seniority = loser.seniority;
  }
  if (merged.tenureMonths === null && loser.tenureMonths !== null) {
    merged.tenureMonths = loser.tenureMonths;
  }
  if (merged.terminatedOn === null && loser.terminatedOn !== null) {
    merged.terminatedOn = loser.terminatedOn;
  }

  if (merged.compensation.annualCtcInr === null && loser.compensation.annualCtcInr !== null) {
    merged.compensation = loser.compensation;
  }
  if (merged.workingHours.isDefaulted && !loser.workingHours.isDefaulted) {
    merged.workingHours = loser.workingHours;
  }
  if (merged.department === 'Unknown' && loser.department !== 'Unknown') {
    merged.department = loser.department;
  }

  const conflicts: Array<[string, unknown, unknown]> = [
    ['role', winner.role, loser.role],
    ['department', winner.department, loser.department],
    ['tenureMonths', winner.tenureMonths, loser.tenureMonths],
    ['annualCtcInr', winner.compensation.annualCtcInr, loser.compensation.annualCtcInr],
  ];

  for (const [field, winnerValue, loserValue] of conflicts) {
    if (winnerValue !== null && loserValue !== null && winnerValue !== loserValue) {
      issues.add({
        code: 'CONFLICTING_EMPLOYEE_FIELD',
        severity: 'warning',
        entity: 'employee',
        entityId: merged.employeeId,
        field,
        rawValue: { kept: winnerValue, discarded: loserValue },
        message: `Duplicate records for ${merged.employeeId} disagree on "${field}". Kept ${String(winnerValue)}, discarded ${String(loserValue)}.`,
      });
    }
  }

  merged.completeness = scoreCompleteness(merged);
  return merged;
}

export interface NormalizeEmployeesResult {
  employees: NormalizedEmployee[];
  byId: Map<string, NormalizedEmployee>;
  recordsRead: number;
  duplicatesMerged: number;
}

export function normalizeEmployees(
  rawEmployees: RawEmployee[],
  issues: IssueCollector,
): NormalizeEmployeesResult {
  const byId = new Map<string, NormalizedEmployee>();
  let duplicatesMerged = 0;

  rawEmployees.forEach((raw, index) => {
    const normalized = normalizeEmployeeRecord(raw, index, issues);
    if (!normalized) return;

    const existing = byId.get(normalized.employeeId);
    if (!existing) {
      byId.set(normalized.employeeId, normalized);
      return;
    }

    duplicatesMerged += 1;
    issues.add({
      code: 'DUPLICATE_EMPLOYEE_RECORD',
      severity: 'warning',
      entity: 'employee',
      entityId: normalized.employeeId,
      sourceIndex: index,
      message: `${normalized.employeeId} appears more than once in the HR export; records were merged.`,
    });
    byId.set(normalized.employeeId, mergeEmployees(existing, normalized, issues));
  });

  const employees = Array.from(byId.values()).sort((a, b) =>
    a.employeeId.localeCompare(b.employeeId),
  );

  return { employees, byId, recordsRead: rawEmployees.length, duplicatesMerged };
}

/**
 * Builds a minimal record for an employee that appears in the activity log but
 * not in the HR master (E013 here — 42 rows, 8% of all activity).
 *
 * Dropping those rows would quietly shrink every company-level total; keeping
 * them under a clearly-flagged synthetic record preserves the totals and makes
 * the gap visible instead of invisible.
 */
export function createSyntheticEmployee(
  employeeId: string,
  department: NormalizedEmployee['department'],
): NormalizedEmployee {
  return {
    employeeId,
    displayName: `Employee ${employeeId} (not in HR master)`,
    department,
    role: null,
    roleRaw: null,
    seniority: 'unknown',
    compensation: UNKNOWN_COMPENSATION,
    tenureMonths: null,
    workingHours: DEFAULT_WORKING_HOURS,
    status: 'unknown',
    terminatedOn: null,
    sourceShape: 'synthetic',
    sourceRecordCount: 0,
    isSynthetic: true,
    completeness: 0,
  };
}
