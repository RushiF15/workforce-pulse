/**
 * `app_used` has 51 distinct raw spellings for ~15 real applications
 * (e.g. gmail / GMAIL / Gmail / " Gmail " are one app; SFDC / Sales Force /
 * salesforce are one app). Aggregating on the raw string would badly
 * fragment every chart, so we map to a stable ID + display label + category.
 *
 * `appCategory` is stored now because it is free at ingestion time and
 * expensive to backfill later.
 */

export const APP_IDS = [
  'gmail',
  'outlook',
  'slack',
  'whatsapp',
  'zoom',
  'excel',
  'word',
  'powerpoint',
  'chrome',
  'salesforce',
  'zoho_crm',
  'sap',
  'tally',
  'notion',
  'jira',
  'unknown',
] as const;

export type AppId = (typeof APP_IDS)[number];

export type AppCategory =
  | 'email'
  | 'chat'
  | 'meetings'
  | 'documents'
  | 'spreadsheets'
  | 'presentations'
  | 'browser'
  | 'crm'
  | 'erp'
  | 'accounting'
  | 'knowledge'
  | 'project_tracking'
  | 'unknown';

export interface AppDefinition {
  id: AppId;
  label: string;
  category: AppCategory;
}

export const APP_DEFINITIONS: Record<AppId, AppDefinition> = {
  gmail: { id: 'gmail', label: 'Gmail', category: 'email' },
  outlook: { id: 'outlook', label: 'Outlook', category: 'email' },
  slack: { id: 'slack', label: 'Slack', category: 'chat' },
  whatsapp: { id: 'whatsapp', label: 'WhatsApp', category: 'chat' },
  zoom: { id: 'zoom', label: 'Zoom', category: 'meetings' },
  excel: { id: 'excel', label: 'Excel', category: 'spreadsheets' },
  word: { id: 'word', label: 'Word', category: 'documents' },
  powerpoint: { id: 'powerpoint', label: 'PowerPoint', category: 'presentations' },
  chrome: { id: 'chrome', label: 'Chrome', category: 'browser' },
  salesforce: { id: 'salesforce', label: 'Salesforce', category: 'crm' },
  zoho_crm: { id: 'zoho_crm', label: 'Zoho CRM', category: 'crm' },
  sap: { id: 'sap', label: 'SAP', category: 'erp' },
  tally: { id: 'tally', label: 'Tally ERP', category: 'accounting' },
  notion: { id: 'notion', label: 'Notion', category: 'knowledge' },
  jira: { id: 'jira', label: 'Jira', category: 'project_tracking' },
  unknown: { id: 'unknown', label: 'Unknown', category: 'unknown' },
};

/**
 * Alias keys are slugified: lowercased, non-alphanumerics stripped.
 * "MS Outlook" -> "msoutlook", " Gmail " -> "gmail".
 */
const APP_ALIASES: Record<string, AppId> = {
  gmail: 'gmail',
  googlemail: 'gmail',

  outlook: 'outlook',
  msoutlook: 'outlook',
  microsoftoutlook: 'outlook',

  slack: 'slack',

  whatsapp: 'whatsapp',
  whatsappweb: 'whatsapp',

  zoom: 'zoom',

  excel: 'excel',
  msexcel: 'excel',
  microsoftexcel: 'excel',

  word: 'word',
  msword: 'word',
  microsoftword: 'word',

  powerpoint: 'powerpoint',
  mspowerpoint: 'powerpoint',
  microsoftpowerpoint: 'powerpoint',
  ppt: 'powerpoint',

  chrome: 'chrome',
  googlechrome: 'chrome',

  salesforce: 'salesforce',
  salesforcecom: 'salesforce',
  sfdc: 'salesforce',

  zoho: 'zoho_crm',
  zohocrm: 'zoho_crm',

  sap: 'sap',

  tally: 'tally',
  tallyerp: 'tally',

  notion: 'notion',
  jira: 'jira',
};

/** Tokens the source uses to mean "no value". */
const NULL_TOKENS = new Set(['', '-', 'na', 'n/a', 'null', 'none', 'unknown', '?']);

const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface AppLookupResult {
  definition: AppDefinition;
  /** false when the raw value was not in the alias table (worth logging). */
  matched: boolean;
  /** true when the source explicitly had no value, rather than an unknown app. */
  wasEmpty: boolean;
}

export function lookupApp(raw: string | null | undefined): AppLookupResult {
  const trimmed = (raw ?? '').trim();
  if (NULL_TOKENS.has(trimmed.toLowerCase())) {
    return { definition: APP_DEFINITIONS.unknown, matched: false, wasEmpty: true };
  }
  const id = APP_ALIASES[slug(trimmed)];
  if (!id) {
    return { definition: APP_DEFINITIONS.unknown, matched: false, wasEmpty: false };
  }
  return { definition: APP_DEFINITIONS[id], matched: true, wasEmpty: false };
}
