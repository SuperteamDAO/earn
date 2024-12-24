import axios from 'axios';
import { z } from 'zod';

import { skillsArraySchema } from '@/interface/skills';
import { validateSolanaAddress } from '@/utils/validateSolAddress';
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
import { hasDevSkills } from '../utils/skills';

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
    firstName: z
      .string({ message: 'First name is required' })
      .min(1, 'First name is required'),
    lastName: z
      .string({ message: 'Last name is required' })
      .min(1, 'Last name is required'),
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
      .enum(web3Exp, { message: 'Invalid Crypto Experience' })
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
    location: z.string().optional().nullable().or(z.literal('')),
    publicKey: z
      .string({ message: 'Wallet address is required' })
      .min(1, 'Wallet address is required')
      .refine(
        (val) => validateSolanaAddress(val).isValid,
        'Invalid Solana wallet address',
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
  if (data.skills && hasDevSkills(data.skills)) {
    if (!data.github) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Github is requierd',
        path: ['github'],
      });
    }
  } else if (!data.twitter) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Twitter is requierd',
      path: ['twitter'],
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
      const response = await axios.get(`${getURL()}api/user/username`, {
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
  firstName: true,
  lastName: true,
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
  firstName: true,
  lastName: true,
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
