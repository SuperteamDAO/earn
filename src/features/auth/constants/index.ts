import { type Prisma } from '@prisma/client';

export const userSelectOptions: Prisma.UserSelect = {
  name: true,
  photo: true,
  isTalentFilled: true,
  username: true,
  id: true,
  location: true,
  currentSponsorId: true,
  publicKey: true,
  skills: true,
  hackathonId: true,
  surveysShown: true,
  featureModalShown: true,
  interests: true,
  community: true,
  private: true,
  acceptedTOS: true,
  cryptoExperience: true,
  currentEmployer: true,
  bio: true,
  discord: true,
  email: true,
  experience: true,
  github: true,
  linkedin: true,
  telegram: true,
  twitter: true,
  website: true,
  workPrefernce: true,
  stLead: true,
  isBlocked: true,

  currentSponsor: {
    select: {
      id: true,
      name: true,
      logo: true,
      isVerified: true,
      entityName: true,
      slug: true,
      isArchived: true,
      st: true,
    },
  },
  UserSponsors: {
    select: {
      sponsorId: true,
      role: true,
    },
  },
  Hackathon: {
    select: {
      id: true,
      name: true,
    },
  },
  Submission: {
    select: {
      id: true,
    },
  },
  emailSettings: true,
};
