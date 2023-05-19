import type { Skills } from '@/interface/skills';

export interface AboutYouType {
  bio: string;
  username: string;
  location: string;
  photo: string;
}

export interface WorkType {
  experience: string;
  cryptoExperience: string;
  currentEmployer: string;
  community: string;
  interests: string;
  skills: Skills;
  subSkills: string;
  workPrefernce: string;
  private: boolean;
}

export interface LinksType {
  discord: string;
  twitter: string;
  github: string;
  linkedin: string;
  website: string;
  telegram: string;
  pow: string;
}

export interface UserStoreType {
  otp: number | undefined;
  setOtp: (data: number) => void;
  emailVerified: boolean;
  verifyEmail: () => void;
  form: AboutYouType & WorkType & LinksType;
  updateState: (
    data: AboutYouType | WorkType | LinksType | { email: string }
  ) => void;
}
