/**
 * Roles are free text in the HRMS, so unlike departments they are NOT a closed
 * set — new titles will appear. The strategy is therefore different:
 *   - canonicalize *formatting* (trim, collapse spaces, Title Case)
 *   - expand known abbreviations (HRBP, SDR, AE)
 *   - derive a coarse `seniority` that IS a closed set, for grouping
 *   - always keep `roleRaw` so nothing is lost
 */

export type Seniority = 'individual_contributor' | 'senior' | 'lead' | 'manager' | 'unknown';

const ROLE_EXPANSIONS: Record<string, string> = {
  hrbp: 'HR Business Partner',
  sdr: 'Sales Development Rep',
  salesdevelopmentrep: 'Sales Development Rep',
  ae: 'Account Executive',
  sr: 'Senior',
};

/** Words that should stay uppercase when title-casing. */
const ACRONYMS = new Set(['HR', 'CRM', 'ERP', 'IT', 'QA', 'SDR', 'AE', 'GST']);

const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function normalizeRole(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (!collapsed) return null;

  const expansion = ROLE_EXPANSIONS[slug(collapsed)];
  if (expansion) return expansion;

  return titleCase(collapsed);
}

export function deriveSeniority(role: string | null): Seniority {
  if (!role) return 'unknown';
  const value = role.toLowerCase();
  if (/\b(manager|head|director|vp)\b/.test(value)) return 'manager';
  if (/\b(lead|principal)\b/.test(value)) return 'lead';
  if (/\b(senior|sr\.?)\b/.test(value)) return 'senior';
  if (/\b(business partner|partner)\b/.test(value)) return 'lead';
  return 'individual_contributor';
}
