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
  st?: boolean;
  verificationInfo?: {
    superteamLead: string;
    fundingSource: string;
    telegram: string;
    commitToDeadline: string;
  };
}
export type { SponsorType };
