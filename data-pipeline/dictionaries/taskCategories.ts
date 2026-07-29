/**
 * `task_category` has 64 raw spellings collapsing to 23 real categories.
 * Three separate axes of noise are present:
 *   1. case      — "reporting" / "Reporting" / "REPORTING"
 *   2. separators— "data-entry" / "data entry" / "Data Entry"
 *   3. abbrev.   — "Cal Mgmt" / "Calendar Mgmt" / "calendar management"
 *                  "Recon" / "Reconciliation", "Invoice Proc" / "Invoice Processing"
 *
 * `isAutomatable` is a first-pass judgement used by later milestones to size
 * automation opportunity. It is a *hypothesis*, kept in the dictionary so it
 * can be tuned in one place rather than hard-coded into charts.
 */

export const TASK_CATEGORY_IDS = [
  'internal_comms',
  'client_comms',
  'email_triage',
  'status_updates',
  'meetings',
  'reporting',
  'research',
  'reconciliation',
  'bookkeeping',
  'invoice_processing',
  'gst_filing_prep',
  'vendor_management',
  'vendor_portals',
  'lead_entry',
  'crm_updates',
  'pipeline_review',
  'calendar_management',
  'data_entry',
  'documentation',
  'document_drafting',
  'deck_building',
  'notes',
  'ticket_updates',
  'unknown',
] as const;

export type TaskCategoryId = (typeof TASK_CATEGORY_IDS)[number];

export interface TaskCategoryDefinition {
  id: TaskCategoryId;
  label: string;
  /** Coarse grouping for roll-ups. */
  group: 'communication' | 'finance' | 'sales' | 'admin' | 'knowledge' | 'unknown';
  /** Working hypothesis: is this category a plausible automation target? */
  isAutomatable: boolean;
}

export const TASK_CATEGORY_DEFINITIONS: Record<TaskCategoryId, TaskCategoryDefinition> = {
  internal_comms: { id: 'internal_comms', label: 'Internal Communication', group: 'communication', isAutomatable: false },
  client_comms: { id: 'client_comms', label: 'Client Communication', group: 'communication', isAutomatable: false },
  email_triage: { id: 'email_triage', label: 'Email Triage', group: 'communication', isAutomatable: true },
  status_updates: { id: 'status_updates', label: 'Status Updates', group: 'communication', isAutomatable: true },
  meetings: { id: 'meetings', label: 'Meetings', group: 'communication', isAutomatable: false },
  reporting: { id: 'reporting', label: 'Reporting', group: 'knowledge', isAutomatable: true },
  research: { id: 'research', label: 'Research', group: 'knowledge', isAutomatable: false },
  reconciliation: { id: 'reconciliation', label: 'Reconciliation', group: 'finance', isAutomatable: true },
  bookkeeping: { id: 'bookkeeping', label: 'Bookkeeping', group: 'finance', isAutomatable: true },
  invoice_processing: { id: 'invoice_processing', label: 'Invoice Processing', group: 'finance', isAutomatable: true },
  gst_filing_prep: { id: 'gst_filing_prep', label: 'GST Filing Prep', group: 'finance', isAutomatable: true },
  vendor_management: { id: 'vendor_management', label: 'Vendor Management', group: 'admin', isAutomatable: false },
  vendor_portals: { id: 'vendor_portals', label: 'Vendor Portals', group: 'admin', isAutomatable: true },
  lead_entry: { id: 'lead_entry', label: 'Lead Entry', group: 'sales', isAutomatable: true },
  crm_updates: { id: 'crm_updates', label: 'CRM Updates', group: 'sales', isAutomatable: true },
  pipeline_review: { id: 'pipeline_review', label: 'Pipeline Review', group: 'sales', isAutomatable: false },
  calendar_management: { id: 'calendar_management', label: 'Calendar Management', group: 'admin', isAutomatable: true },
  data_entry: { id: 'data_entry', label: 'Data Entry', group: 'admin', isAutomatable: true },
  documentation: { id: 'documentation', label: 'Documentation', group: 'knowledge', isAutomatable: false },
  document_drafting: { id: 'document_drafting', label: 'Document Drafting', group: 'knowledge', isAutomatable: true },
  deck_building: { id: 'deck_building', label: 'Deck Building', group: 'knowledge', isAutomatable: true },
  notes: { id: 'notes', label: 'Notes', group: 'knowledge', isAutomatable: false },
  ticket_updates: { id: 'ticket_updates', label: 'Ticket Updates', group: 'admin', isAutomatable: true },
  unknown: { id: 'unknown', label: 'Unknown', group: 'unknown', isAutomatable: false },
};

/** Alias keys are slugified: lowercase, non-alphanumerics stripped. */
const TASK_CATEGORY_ALIASES: Record<string, TaskCategoryId> = {
  internalcomms: 'internal_comms',
  internalcommunication: 'internal_comms',
  internalcommunications: 'internal_comms',

  clientcomms: 'client_comms',
  clientcommunication: 'client_comms',
  clientcommunications: 'client_comms',

  emailtriage: 'email_triage',
  inboxtriage: 'email_triage',

  statusupdates: 'status_updates',
  statusupdate: 'status_updates',

  meetings: 'meetings',
  meeting: 'meetings',
  internalmeeting: 'meetings',
  // NOTE: "Client Call" is a judgement call — filed under meetings rather than
  // client_comms because it is synchronous. Flagged for business confirmation.
  clientcall: 'meetings',

  reporting: 'reporting',
  reports: 'reporting',

  research: 'research',

  recon: 'reconciliation',
  reconciliation: 'reconciliation',

  bookkeeping: 'bookkeeping',

  invoiceproc: 'invoice_processing',
  invoiceprocessing: 'invoice_processing',

  gstprep: 'gst_filing_prep',
  gstfilingprep: 'gst_filing_prep',

  vendormgmt: 'vendor_management',
  vendormanagement: 'vendor_management',

  vendorportals: 'vendor_portals',
  vendorportal: 'vendor_portals',

  leadentry: 'lead_entry',

  crmupdate: 'crm_updates',
  crmupdates: 'crm_updates',

  pipelinereview: 'pipeline_review',

  calmgmt: 'calendar_management',
  calendarmgmt: 'calendar_management',
  calendarmanagement: 'calendar_management',

  dataentry: 'data_entry',

  docs: 'documentation',
  documentation: 'documentation',

  drafting: 'document_drafting',
  docdrafting: 'document_drafting',
  documentdrafting: 'document_drafting',

  deckbuilding: 'deck_building',
  slidebuilding: 'deck_building',

  notes: 'notes',

  ticketupdates: 'ticket_updates',
  ticketupdate: 'ticket_updates',
};

const NULL_TOKENS = new Set(['', '-', 'na', 'n/a', 'null', 'none', 'unknown', '?']);

const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface TaskCategoryLookupResult {
  definition: TaskCategoryDefinition;
  matched: boolean;
  wasEmpty: boolean;
}

export function lookupTaskCategory(raw: string | null | undefined): TaskCategoryLookupResult {
  const trimmed = (raw ?? '').trim();
  if (NULL_TOKENS.has(trimmed.toLowerCase())) {
    return { definition: TASK_CATEGORY_DEFINITIONS.unknown, matched: false, wasEmpty: true };
  }
  const id = TASK_CATEGORY_ALIASES[slug(trimmed)];
  if (!id) {
    return { definition: TASK_CATEGORY_DEFINITIONS.unknown, matched: false, wasEmpty: false };
  }
  return { definition: TASK_CATEGORY_DEFINITIONS[id], matched: true, wasEmpty: false };
}
