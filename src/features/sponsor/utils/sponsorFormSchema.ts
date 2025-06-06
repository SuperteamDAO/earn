import { z } from 'zod';

import {
  discordInviteSchema,
  githubUsernameSchema,
  linkedinCompanyUsernameSchema,
  telegramUsernameSchema,
  twitterUsernameSchema,
  websiteUrlSchema,
} from '@/features/social/utils/schema';

export const sponsorBaseSchema = z
  .object({
    name: z.string().min(1, 'Entity name is required'),
    slug: z
      .string()
      .min(1, 'Entity username is required')
      .regex(
        /^[a-zA-Z0-9-]+$/,
        `Slug can only contain lowercase letters, numbers, '_', and '-'`,
      )
      .toLowerCase(),
    bio: z
      .string()
      .min(1, 'Entity bio is required')
      .max(180, 'Bio must be less than 180 characters'),
    logo: z.string().min(1, 'Entity logo is required'),
    banner: z.string().optional().or(z.literal('')),
    industry: z.string().min(1, 'At least one industry must be selected'),

    entityName: z.string().min(1, 'Entity name is required'),
    discord: discordInviteSchema.optional().or(z.literal('')),
    twitter: twitterUsernameSchema.optional().or(z.literal('')),
    github: githubUsernameSchema.optional().or(z.literal('')),
    linkedinCompany: linkedinCompanyUsernameSchema.optional().or(z.literal('')),
    telegram: telegramUsernameSchema.optional().or(z.literal('')),
    website: websiteUrlSchema.optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (!data.website) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Entity URL is required',
        path: ['website'],
      });
    }
  });

export const userSponsorDetailsSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  username: z
    .string()
    .min(1, 'Username is required')
    .max(40, 'Username must be less than 40 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Only letters, numbers, underscores, and hyphens are allowed',
    ),
  photo: z.string().optional(),
});

export const sponsorFormSchema = z.object({
  sponsor: sponsorBaseSchema,
  user: userSponsorDetailsSchema.optional(),
});

export type SponsorBase = z.infer<typeof sponsorBaseSchema>;
export type UserSponsorDetails = z.infer<typeof userSponsorDetailsSchema>;
export type SponsorFormValues = z.infer<typeof sponsorFormSchema>;

export const transformFormToApiData = (data: SponsorFormValues) => {
  const sponsorData: SponsorBase = {
    name: data.sponsor.name,
    slug: data.sponsor.slug.toLowerCase(),
    bio: data.sponsor.bio,
    logo: data.sponsor.logo,
    banner: data.sponsor.banner || undefined,
    industry: data.sponsor.industry,
    twitter: data.sponsor.twitter || undefined,
    github: data.sponsor.github || undefined,
    discord: data.sponsor.discord || undefined,
    linkedinCompany: data.sponsor.linkedinCompany || undefined,
    telegram: data.sponsor.telegram || undefined,
    website: data.sponsor.website,
    entityName: data.sponsor.entityName,
  };

  const userData = data.user
    ? {
        name: data.user.name,
        username: data.user.username,
        photo: data.user.photo,
      }
    : null;

  return {
    sponsorData,
    userData,
  };
};

export const shouldUpdateUser = (
  formData: UserSponsorDetails,
  currentUser: any,
) => {
  return (
    formData.name !== currentUser?.name ||
    formData.username !== currentUser?.username ||
    formData.photo !== currentUser?.photo
  );
};
