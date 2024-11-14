import { z } from 'zod';

import { URL_REGEX } from '@/constants';

export const sponsorBaseSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  slug: z
    .string()
    .min(1, 'Company username is required')
    .regex(/^[a-zA-Z0-9-]+$/, 'Only letters, numbers, and hyphens are allowed')
    .toLowerCase(),
  bio: z
    .string()
    .min(1, 'Company bio is required')
    .max(180, 'Bio must be less than 180 characters'),
  logo: z.string().min(1, 'Company logo is required'),
  industry: z.string().min(1, 'At least one industry must be selected'),
  url: z
    .union([z.literal(''), z.string().regex(URL_REGEX, 'Invalid URL')])
    .optional(),
  twitter: z.string().min(1, 'Twitter handle is required'),
  entityName: z.string().min(1, 'Entity name is required'),
});

export const userSponsorDetailsSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
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
    industry: data.sponsor.industry,
    url: data.sponsor.url,
    twitter: data.sponsor.twitter,
    entityName: data.sponsor.entityName,
  };

  const userData = data.user
    ? {
        firstName: data.user.firstName,
        lastName: data.user.lastName,
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
    formData.firstName !== currentUser?.firstName ||
    formData.lastName !== currentUser?.lastName ||
    formData.username !== currentUser?.username ||
    formData.photo !== currentUser?.photo
  );
};
