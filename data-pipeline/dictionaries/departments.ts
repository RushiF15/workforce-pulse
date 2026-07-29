/**
 * Departments are a closed set. Both files already agree on the six values,
 * but the CSV carries a *denormalized copy* of the department on every row —
 * so we still canonicalize it in order to detect disagreement with HR master.
 */

export const DEPARTMENTS = [
  'Operations',
  'Finance',
  'Sales',
  'Customer Support',
  'HR',
  'Marketing',
  'Unknown',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/** Keys are slugified (lowercase, alphanumeric only). */
const DEPARTMENT_ALIASES: Record<string, Department> = {
  operations: 'Operations',
  ops: 'Operations',
  finance: 'Finance',
  fin: 'Finance',
  accounts: 'Finance',
  sales: 'Sales',
  revenue: 'Sales',
  customersupport: 'Customer Support',
  support: 'Customer Support',
  cs: 'Customer Support',
  customerservice: 'Customer Support',
  hr: 'HR',
  humanresources: 'HR',
  people: 'HR',
  marketing: 'Marketing',
  growth: 'Marketing',
};

const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Returns `null` (not 'Unknown') when unmapped, so callers can log the miss. */
export function lookupDepartment(raw: string | null | undefined): Department | null {
  if (!raw) return null;
  return DEPARTMENT_ALIASES[slug(raw)] ?? null;
}
