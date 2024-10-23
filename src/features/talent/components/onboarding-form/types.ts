import type { Skills } from '@/interface/skills';

interface AboutYouType {
  username: string;
  location: string;
  photo: string;
  skills: Skills;
  subSkills: string;
  publicKey: string;
}

interface LinksType {
  discord: string;
  twitter: string;
  github: string;
  linkedin: string;
  website: string;
  telegram: string;
}

export interface UserStoreType {
  emailVerified: boolean;
  form: AboutYouType & LinksType;
  updateState: (data: AboutYouType | LinksType | { email: string }) => void;
}
