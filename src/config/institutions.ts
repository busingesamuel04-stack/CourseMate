/**
 * Institution Registry
 * Single source of truth for supported Ugandan universities.
 * Drives onboarding UI, scraper routing, and portal credential labels.
 */

export type InstitutionId = 'mak' | 'kyu' | 'mubs' | 'isbat';
export type ScraperEngine = 'ACMIS' | 'ISMIS' | 'CUSTOM';

export interface CredentialFields {
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  helperText: string;
}

export interface InstitutionConfig {
  id: InstitutionId;
  name: string;
  shortName: string;
  engine: ScraperEngine;
  portalUrl: string;
  brandColor: string;
  badgeText: string;
  location?: string;
  credentialFields: CredentialFields;
}

// ── Registry ──────────────────────────────────────────────────────────────────

export const INSTITUTIONS: readonly InstitutionConfig[] = [
  {
    id: 'mak',
    name: 'Makerere University',
    shortName: 'Mak',
    engine: 'ACMIS',
    portalUrl: 'https://myportal.mak.ac.ug',
    brandColor: '#1e3a8a',
    badgeText: 'ACMIS Portal',
    location: 'Makerere Hill, Kampala',
    credentialFields: {
      usernameLabel: 'Student Number or Reg. Number',
      usernamePlaceholder: 'e.g. 2100701234 or 21/U/1234',
      passwordLabel: 'ACMIS Portal Password / PIN',
      helperText: 'Use your Makerere student number or registration number',
    },
  },
  {
    id: 'kyu',
    name: 'Kyambogo University',
    shortName: 'KyU',
    engine: 'ACMIS',
    portalUrl: 'https://myportal.kyu.ac.ug',
    brandColor: '#065f46',
    badgeText: 'ACMIS Portal',
    location: 'Kyambogo Hill, Kampala',
    credentialFields: {
      usernameLabel: 'Student Number or Reg. Number',
      usernamePlaceholder: 'e.g. 23/U/204 or 2300...',
      passwordLabel: 'ACMIS Portal Password / PIN',
      helperText: 'Use your Kyambogo student number or registration number',
    },
  },
  {
    id: 'mubs',
    name: 'Makerere University Business School',
    shortName: 'MUBS',
    engine: 'ACMIS',
    portalUrl: 'https://myportal.mubs.ac.ug',
    brandColor: '#7c3aed',
    badgeText: 'ACMIS Portal',
    location: 'Nakawa Campus, Kampala',
    credentialFields: {
      usernameLabel: 'Student Number or Reg. Number',
      usernamePlaceholder: 'e.g. 22/M/5678',
      passwordLabel: 'ACMIS Portal Password / PIN',
      helperText: 'Use your MUBS student number or registration number',
    },
  },
  {
    id: 'isbat',
    name: 'ISBAT University',
    shortName: 'ISBAT',
    engine: 'ISMIS',
    portalUrl: 'https://erp.isbatuniversity.ac.ug',
    brandColor: '#0e7490',
    badgeText: 'ISMIS ERP',
    location: 'Lugogo Bypass, Kampala',
    credentialFields: {
      usernameLabel: 'Student ID / Username',
      usernamePlaceholder: 'e.g. 011260415',
      passwordLabel: 'Portal Password',
      helperText: 'Use your student ID from erp.isbatuniversity.ac.ug',
    },
  },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map legacy SupportedUniversity display names (used throughout the app)
 * back to the registry InstitutionConfig.
 */
const LEGACY_NAME_MAP: Record<string, InstitutionId> = {
  'Makerere University': 'mak',
  'Kyambogo University': 'kyu',
  'MUBS': 'mubs',
  'Makerere University Business School': 'mubs',
  'ISBAT University': 'isbat',
  'mak': 'mak',
  'kyu': 'kyu',
  'mubs': 'mubs',
  'isbat': 'isbat',
};

/**
 * Look up an institution by its stable ID (e.g. 'mak', 'kyu', 'mubs', 'isbat')
 * or by its display name.
 */
export function getInstitution(id: string): InstitutionConfig {
  const normalizedId = (id || '').toLowerCase().trim();
  const mappedId = LEGACY_NAME_MAP[id] || LEGACY_NAME_MAP[normalizedId];
  const found = INSTITUTIONS.find((i) => i.id === normalizedId || i.id === mappedId);
  if (found) {
    return found;
  }
  // Try matching by name
  const byName = INSTITUTIONS.find((i) => i.name.toLowerCase() === (id || '').toLowerCase());
  if (byName) {
    return byName;
  }
  throw new Error(
    `[InstitutionRegistry] Unknown institution id: "${id}". Valid ids: ${INSTITUTIONS.map((i) => i.id).join(', ')}`
  );
}

export function getInstitutionByName(displayName: string): InstitutionConfig | undefined {
  const mappedId = LEGACY_NAME_MAP[displayName];
  if (mappedId) {
    return INSTITUTIONS.find((i) => i.id === mappedId);
  }
  return INSTITUTIONS.find((i) => i.name.toLowerCase() === displayName.toLowerCase());
}
