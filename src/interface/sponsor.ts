interface SponsorType {
  id?: string;
  slug: string;
  name: string;
  logo?: string | null;
  url?: string | null;
  industry?: string;
  twitter?: string | null;
  bio?: string | null;
  entityName?: string | null;
  location?: string | null;
  isVerified?: boolean;
  isCaution?: boolean;
  chapter?: {
    id: string;
    region?: string;
    displayValue?: string | null;
    code?: string | null;
    countries?: unknown;
    icons?: string | null;
  } | null;
  verificationInfo?: {
    superteamLead: string;
    fundingSource: string;
    telegram: string;
    commitToDeadline: string;
  };
}
export type { SponsorType };
