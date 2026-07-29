import type { Department } from '../dictionaries/departments';
import type { Seniority } from '../dictionaries/roles';
import type { Compensation } from '../normalizers/compensation';
import type { WorkingHours } from '../normalizers/workingHours';

/* ================================================================== *
 * RAW SHAPES — what actually arrives in employees.json                *
 * ================================================================== *
 *
 * The export contains four different record shapes because the HRMS schema
 * was migrated mid-year. We model all four explicitly rather than reaching
 * for `any`: the union is the documentation of what we must handle.
 */

/** Shape A — legacy PascalCase (E001, E002, E003, E007, E008, E015). */
export interface RawEmployeeLegacy {
  EmployeeID: string;
  Name?: string;
  Dept?: string;
  Role?: string;
  salary_LPA?: number | string | null;
  tenureMonths?: number | string | null;
  workingHours?: string | null;
  Status?: string;
}

/** Shape B/C — migrated snake_case, flat, annual or hourly compensation. */
export interface RawEmployeeModern {
  employee_id: string;
  name?: string;
  department?: string;
  role?: string;
  annual_ctc_inr?: number | string | null;
  hourly_rate_inr?: number | string | null;
  tenure_months?: number | string | null;
  working_hours?: string | { start?: string; end?: string; timezone?: string } | null;
  status?: string;
  terminated_on?: string | null;
}

/** Shape D — snake_case with role/compensation nested under `meta` (E009, E010). */
export interface RawEmployeeNested {
  employee_id: string;
  name?: string;
  department?: string;
  status?: string;
  terminated_on?: string | null;
  meta: {
    role?: string;
    compensation?: { currency?: string; annual?: number | string | null } | null;
    tenure_months?: number | string | null;
    working_hours?: string | { start?: string; end?: string; timezone?: string } | null;
  };
}

export type RawEmployee = RawEmployeeLegacy | RawEmployeeModern | RawEmployeeNested;

export interface RawEmployeeFile {
  generated_at?: string;
  source_system?: string;
  currency_default?: string;
  notes?: string;
  employees: RawEmployee[];
}

/* ================================================================== *
 * CANONICAL SHAPE — the single schema everything downstream uses      *
 * ================================================================== */

export type EmploymentStatus = 'active' | 'terminated' | 'unknown';

export interface NormalizedEmployee {
  /** Canonical "E###". Primary key across both datasets. */
  employeeId: string;
  displayName: string;
  department: Department;
  /** Cleaned, Title-Cased role. */
  role: string | null;
  /** Exactly as it appeared in the source — never lost. */
  roleRaw: string | null;
  seniority: Seniority;
  compensation: Compensation;
  tenureMonths: number | null;
  workingHours: WorkingHours;
  status: EmploymentStatus;
  /** YYYY-MM-DD, only meaningful when status === 'terminated'. */
  terminatedOn: string | null;

  /* --- provenance --- */
  /** Which raw shape this record came from. */
  sourceShape: 'legacy' | 'modern' | 'nested' | 'synthetic';
  /** >1 when duplicate records for this ID were merged. */
  sourceRecordCount: number;
  /**
   * True when the employee did not exist in the HR master and was created from
   * activity data alone (see DATA_CONFIG.unknownEmployeeStrategy).
   */
  isSynthetic: boolean;
  /** 0..1 — share of canonical fields that carry real source data. */
  completeness: number;
}
