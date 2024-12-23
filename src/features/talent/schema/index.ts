import axios from 'axios';
import { z } from 'zod';

import { CountryList } from '@/constants/countryList';
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

export const profileSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .max(40, 'Username cannot exceed 40 characters')
      .regex(
        USERNAME_PATTERN,
        'Username can only contain lowercase letters, numbers, underscores and hyphens',
      )
      .transform((val) => val.replace(/^[-\s]+|[-\s]+$/g, '')),
    photo: z.string().optional().nullable(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    bio: z.string().max(180, 'Bio cannot exceed 180 characters').optional(),
    discord: discordUsernameSchema,
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
    interests: z.enum(IndustryList).array().optional().nullable(),
    experience: z.enum(workExp).optional().nullable().or(z.literal('')),
    cryptoExperience: z.enum(web3Exp).optional().nullable().or(z.literal('')),
    workPrefernce: z.enum(workType).optional().nullable().or(z.literal('')),
    currentEmployer: z.string().optional(),
    skills: skillsArraySchema,
    private: z.boolean().default(false),
    location: z.enum(CountryList).optional().nullable().or(z.literal('')),
    publicKey: z
      .string()
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
  const socialFields = ['twitter', 'github', 'linkedin', 'website', 'telegram'];
  const filledSocials = socialFields.filter(
    (field) => data[field as keyof typeof data],
  );

  if (filledSocials.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'At least one additional social link (apart from Discord) is required',
      path: ['website'], // website is at the end in UI
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
