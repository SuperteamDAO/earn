interface SponsorType {
  id?: string;
  slug: string;
  name: string;
  logo?: string;
  url?: string;
  industry?: string;
  twitter?: string;
  bio?: string;
  entityName?: string;
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
