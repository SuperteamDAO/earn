interface SponsorType {
  id?: string;
  slug: string;
  name: string;
  logo?: string;
  banner?: string;
  url?: string;
  industry?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  telegram?: string;
  discord?: string;
  bio?: string;
  entityName?: string;
  isVerified?: boolean;
  isCaution?: boolean;
  st?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  nearTreasury?: {
    dao: string;
    frontend: string;
  };
}
export type { SponsorType };
