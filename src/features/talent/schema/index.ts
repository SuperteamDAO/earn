import { z } from 'zod';

import { skillsArraySchema } from '@/interface/skills';
import { api } from '@/lib/api';
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
      .string({
          error: 'Username is required'
    })
      .min(1, 'Username is required')
      .max(40, 'Username cannot exceed 40 characters')
      .regex(
        USERNAME_PATTERN,
        `Username can only contain lowercase letters, numbers, '_', and '-'`,
      )
      .transform((val) => val.replace(/^[-\s]+|[-\s]+$/g, '')),
    photo: z.string().optional().nullable(),
    firstName: z
      .string({
          error: 'First name is required'
    })
      .min(1, 'First name is required')
      .regex(/^[A-Za-z\s]+$/, 'First name can only contain letters and spaces'),
    lastName: z
      .string({
          error: 'Last name is required'
    })
      .min(1, 'Last name is required')
      .regex(/^[A-Za-z\s]+$/, 'Last name can only contain letters and spaces'),
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
      .enum(IndustryList, {
          error: 'Invalid Industry'
    })
      .array()
      .optional()
      .nullable(),
    experience: z
      .enum(workExp, {
          error: 'Invalid Work Experience'
    })
      .optional()
      .nullable()
      .or(z.literal('')),
    cryptoExperience: z
      .enum(web3Exp, {
          error: 'Invalid Crypto Experience'
    })
      .optional()
      .nullable()
      .or(z.literal('')),
    workPrefernce: z
      .enum(workType, {
          error: 'Invalid Work Preference'
    })
      .optional()
      .nullable()
      .or(z.literal('')),
    currentEmployer: z.string().optional(),
    skills: skillsArraySchema,
    private: z.boolean().prefault(false),
    location: z.string(),
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
        code: "custom",
        message: 'Github is requierd',
        path: ['github'],
      });
    }
  } else if (!data.twitter) {
    ctx.addIssue({
      code: "custom",
      message: 'X is requierd',
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
      const response = await api.get(`${getURL()}api/user/username`, {
        params: {
          username: data.username,
          userId,
        },
      });
      const available = response.data.available;
      if (!available) {
        ctx.addIssue({
          code: "custom",
          message: 'Username is unavailable! Please try another one.',
          path: ['username'],
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: "custom",
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
  skills: true,
  discord: true,
  twitter: true,
  github: true,
  linkedin: true,
  telegram: true,
  website: true,
});
export type NewTalentFormData = z.infer<typeof newTalentSchema>;
