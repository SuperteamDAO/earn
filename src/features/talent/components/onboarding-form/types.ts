import type { Skills } from '@/interface/skills';

interface AboutYouType {
  bio: string;
  username: string;
  location: string;
  photo: string;
}

interface WorkType {
  experience: string;
  cryptoExperience: string;
  currentEmployer: string;
  community: string;
  interests: string;
  skills: Skills;
  subSkills: string;
  workPrefernce: string;
  isPrivate: boolean;
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
  form: AboutYouType & WorkType & LinksType;
  updateState: (
    data: AboutYouType | WorkType | LinksType | { email: string },
  ) => void;
}
