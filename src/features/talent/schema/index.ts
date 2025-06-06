import { z } from 'zod';

import { CHAIN_NAME } from '@/constants/project';
import { skillsArraySchema } from '@/interface/skills';
import { api } from '@/lib/api';
import { validateNearAddress } from '@/utils/validateNearAddress';
import { getURL } from '@/utils/validUrl';

import {
  discordUsernameSchema,
  githubUsernameSchema,
  linkedinUsernameSchema,
  telegramUsernameSchema,
  twitterUsernameSchema,
  websiteUrlSchema,
} from '@/features/social/utils/schema';

import {
  IndustryList,
  USERNAME_PATTERN,
  web3Exp,
  workExp,
  workType,
} from '../constants';

export const profileSchema = z
  .object({
    username: z
      .string({ message: 'Username is required' })
      .min(1, 'Username is required')
      .max(40, 'Username cannot exceed 40 characters')
      .regex(
        USERNAME_PATTERN,
        `Username can only contain lowercase letters, numbers, '_', and '-'`,
      )
      .transform((val) => val.replace(/^[-\s]+|[-\s]+$/g, '')),
    photo: z.string().optional().nullable(),
    name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
    bio: z.string().max(180, 'Bio cannot exceed 180 characters').optional(),
    discord: discordUsernameSchema.optional().or(z.literal('')),
    twitter: twitterUsernameSchema.optional().or(z.literal('')),
    github: githubUsernameSchema.optional().or(z.literal('')),
    linkedin: linkedinUsernameSchema.optional().or(z.literal('')),
    telegram: telegramUsernameSchema.optional().or(z.literal('')),
    website: websiteUrlSchema.optional().or(z.literal('')),
    community: z.string().array().optional().nullable(),
    // removing this since for some unknown reason where even valid one's fail only in backend
    // .refine(
    //   (community) => {
    //     if (!community) return true;
    //     return community.every((item) => CommunityList.includes(item));
    //   },
    //   {
    //     message: 'Invalid Community values',
    //   },
    // )
    interests: z
      .enum(IndustryList, { message: 'Invalid Industry' })
      .array()
      .optional()
      .nullable(),
    experience: z
      .enum(workExp, { message: 'Invalid Work Experience' })
      .optional()
      .nullable()
      .or(z.literal('')),
    cryptoExperience: z
      .enum(web3Exp, { message: 'Invalid Web3 Experience' })
      .optional()
      .nullable()
      .or(z.literal('')),
    workPrefernce: z
      .enum(workType, { message: 'Invalid Work Preference' })
      .optional()
      .nullable()
      .or(z.literal('')),
    currentEmployer: z.string().optional(),
    skills: skillsArraySchema,
    private: z.boolean().default(false),
    location: z.string(),
    publicKey: z
      .string({ message: 'Wallet address is required' })
      .min(1, 'Wallet address is required')
      .refine(
        (val) => validateNearAddress(val).isValid,
        `Invalid ${CHAIN_NAME} wallet address`,
      ),
  })
  .superRefine((data, ctx) => {
    socialSuperRefine(data, ctx);
  });

export type ProfileFormData = z.infer<typeof profileSchema>;

export const socialSuperRefine = async (
  data: Partial<ProfileFormData>,
  ctx: z.RefinementCtx,
) => {
  const socialFields = [
    data.discord,
    data.twitter,
    data.github,
    data.linkedin,
    data.telegram,
    data.website,
  ];

  const hasAtLeastOneSocial = socialFields.some(
    (field) => field && field.trim() !== '',
  );

  if (!hasAtLeastOneSocial) {
    const socialPaths = [
      'discord',
      'twitter',
      'github',
      'linkedin',
      'telegram',
      'website',
    ];
    socialPaths.forEach((path) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please fill at least one social media field',
        path: [path],
      });
    });
  }
};

export const usernameSuperRefine = async (
  data: Partial<ProfileFormData>,
  ctx: z.RefinementCtx,
  userId: string,
) => {
  if (data.username) {
    try {
      const response = await api.get(`${getURL()}api/user/username`, {
        params: {
          username: data.username,
          userId,
        },
      });
      const available = response.data.available;
      if (!available) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Username is unavailable! Please try another one.',
          path: ['username'],
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An error occurred while checking username availability.',
        path: ['username'],
      });
    }
  }
};

export const newTalentSchema = profileSchema._def.schema.pick({
  username: true,
  name: true,
  location: true,
  photo: true,
  publicKey: true,
  skills: true,
  discord: true,
  twitter: true,
  github: true,
  linkedin: true,
  telegram: true,
  website: true,
});
export type NewTalentFormData = z.infer<typeof newTalentSchema>;

export const aboutYouSchema = profileSchema._def.schema.pick({
  username: true,
  name: true,
  location: true,
  photo: true,
  publicKey: true,
  skills: true,
});

export type AboutYouFormData = z.infer<typeof aboutYouSchema>;

export const yourLinksSchema = profileSchema._def.schema
  .pick({
    discord: true,
    twitter: true,
    github: true,
    linkedin: true,
    telegram: true,
    website: true,
  })
  .superRefine((data, ctx) => {
    socialSuperRefine(data, ctx);
  });

export type YourLinksFormData = z.infer<typeof yourLinksSchema>;
