import {
  BountyType,
  CompensationType,
  type Hackathon,
  Regions,
  status,
} from '@prisma/client';
import { z } from 'zod';

import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  tokenList,
} from '@/constants';
import { type Listing } from '@/features/listings';
import { emailRegex, telegramRegex, twitterRegex } from '@/features/talent';
import { skillsArraySchema } from '@/interface/skills';
import { dayjs } from '@/utils/dayjs';

import { DEADLINE_FORMAT } from '../components/Form';
import { fetchSlugCheck } from '../queries/slug-check';
import { type ListingFormData } from '.';

interface ListingFormSchemaOptions {
  isGod: boolean;
  isEditing: boolean;
  isST: boolean;
  pastListing?: Listing;
  hackathon?: Hackathon;
}
export const createListingFormSchema = ({
  isGod,
  isEditing,
  isST,
  pastListing,
  hackathon,
}: ListingFormSchemaOptions) => {
  const eligibilityQuestionSchema = z.object({
    order: z.number(),
    question: z.string().trim().min(1, 'Please add your question').max(256),
    type: z.enum(['text', 'link']),
  });

  const rewardsSchema = z
    .record(
      z.coerce.number(),
      z
        .number({
          message: 'Required',
        })
        .min(0.01, 'Reward'),
      {
        message: 'Required',
      },
    )
    .refine(
      (rewards) => {
        const positions = Object.keys(rewards).map(Number);
        const regularPositions = positions.filter(
          (pos) => pos !== BONUS_REWARD_POSITION,
        );
        return regularPositions.length <= MAX_PODIUMS;
      },
      {
        message: `Cannot exceed ${MAX_PODIUMS} reward positions`,
      },
    )
    .refine(
      (rewards) => {
        const positions = Object.keys(rewards).map(Number);
        const regularPositions = positions.filter(
          (pos) => pos !== BONUS_REWARD_POSITION,
        );
        const sortedPositions = regularPositions.sort((a, b) => a - b);
        return sortedPositions.every((pos, idx) => pos === idx + 1);
      },
      {
        message: `Reward positions must be sequential starting from 1`,
      },
    )
    .refine(
      (rewards) => {
        const bonusAmount = rewards[BONUS_REWARD_POSITION];
        if (bonusAmount === undefined) return true;

        const positions = Object.keys(rewards).map(Number);
        const regularPositions = positions.filter(
          (pos) => pos !== BONUS_REWARD_POSITION,
        );
        const totalBonusAmount = bonusAmount * MAX_BONUS_SPOTS;
        const regularRewardsSum = regularPositions.reduce(
          (sum, pos) => sum + (rewards[pos] || 0),
          0,
        );
        return regularRewardsSum + totalBonusAmount <= Number.MAX_SAFE_INTEGER;
      },
      {
        message: `Total rewards amount exceeds maximum allowed value`,
      },
    )
    .refine(
      (rewards) => {
        return Object.values(rewards).every((value) => !Number.isNaN(value));
      },
      {
        message: 'All reward values must be valid numbers',
      },
    )
    .transform((rewards) => {
      return Object.fromEntries(
        Object.entries(rewards).map(([key, value]) => [
          String(key),
          Number(value),
        ]),
      );
    });

  return z
    .object({
      id: z.string().optional(),
      title: z.string().trim().min(1, 'Required').max(100),
      slug: z
        .string()
        .trim()
        .min(1, 'Required')
        .max(120)
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          'Slug should only contain lowercase alphabets, numbers, and hyphens',
        ),
      // we cannot do this here, coz once slug is dirty, any field change will trigger this
      // .refine(
      //   async (slug) => await slugUniqueCheck(slug),
      //   {
      //     message: 'Slug already exists. Please try another.',
      //   },
      // ),
      pocSocials: z
        .string()
        .trim()
        .min(1, 'Required')
        .max(256, 'Too long')
        .refine(
          (value) => {
            return (
              twitterRegex.test(value) ||
              telegramRegex.test(value) ||
              emailRegex.test(value)
            );
          },
          {
            message: 'Please enter a valid X / Telegram link, or email address',
          },
        ),
      description: z.string().trim().min(1, 'Required'),
      type: z
        .nativeEnum(BountyType)
        .default('bounty')
        .refine((data) => {
          console.log('hackathon at dead check', hackathon);
          if (data === 'hackathon') {
            return !!hackathon;
          }
          return true;
        }, 'Hackathon is not allowed for now'),
      region: z.string().trim().min(1).max(256).default(Regions.GLOBAL),
      deadline: z
        .string()
        .trim()
        .datetime({
          message: 'Required',
          local: true,
        })
        .min(1, 'Required')
        .default(dayjs().add(7, 'day').format(DEADLINE_FORMAT).replace('Z', ''))
        .refine((date) => {
          if (isGod && isEditing) return true;
          return isGod || dayjs(date).isAfter(dayjs());
        }, 'Deadline cannot be in the past')
        .refine((date) => {
          if (!isEditing || isGod || !pastListing?.deadline) return true;
          const newDeadline = dayjs(date);
          const pastDeadlineDate = dayjs(pastListing.deadline);
          const maxDeadline = pastDeadlineDate.add(2, 'weeks');
          return (
            newDeadline.isBefore(maxDeadline) || newDeadline.isSame(maxDeadline)
          );
        }, 'Cannot extend deadline more than 2 weeks from original deadline'),
      templateId: z.string().optional().nullable(),
      eligibility: z.array(eligibilityQuestionSchema).optional(),
      skills: skillsArraySchema,

      token: z
        .enum(
          tokenList.map((token) => token.tokenSymbol) as [string, ...string[]],
          {
            errorMap: () => ({ message: 'Token Not Allowed' }),
          },
        )
        .default('USDC'),
      rewardAmount: z
        .number({
          message: 'Required',
        })
        .min(0)
        .optional(),
      rewards: rewardsSchema.optional(),
      compensationType: z.nativeEnum(CompensationType).default('fixed'),
      minRewardAsk: z.number().min(0).optional().nullable(),
      maxRewardAsk: z.number().min(0).optional().nullable(),
      maxBonusSpots: z
        .number({
          message: 'Required',
        })
        .min(0)
        .max(50)
        .optional(),
      isFndnPaying: z
        .boolean()
        .default(false)
        .refine(
          (value) => {
            if (value === true && !isST) {
              return false;
            }
            return true;
          },
          {
            message:
              'Foundation paying can only be enabled for Superteam listings',
          },
        ),
      isPrivate: z.boolean().default(false),
      hackathonId: z.string().optional().nullable(),

      // values that will not be set on any API, but useful for response
      isPublished: z.boolean().optional().nullable(),
      isWinnersAnnounced: z.boolean().optional().nullable(),
      totalWinnersSelected: z.number().optional().nullable(),
      totalPaymentsMade: z.number().optional().nullable(),
      status: z.nativeEnum(status).optional().nullable(),
      publishedAt: z
        .union([z.string().datetime(), z.date(), z.null()])
        .optional()
        .nullable(),
      sponsorId: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      createListingRefinements(data, ctx, hackathon);
    });
};

export const createListingRefinements = async (
  data: ListingFormData,
  ctx: z.RefinementCtx,
  hackathon?: Hackathon,
) => {
  console.log('zod validating');
  const slugUniqueCheck = async (slug: string, id?: string) => {
    try {
      await fetchSlugCheck({
        slug,
        id: id || undefined,
        check: true,
      });
      return true;
    } catch (error) {
      console.log('fetchSlugCheck error', error);
      return false;
    }
  };
  if (data.slug && !(await slugUniqueCheck(data.slug, data.id))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Slug already exists. Please try another.',
      path: ['slug'],
    });
  }

  if (data.compensationType === 'fixed') {
    if (!data.rewardAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please add rewards',
        path: ['rewards'],
      });
    }
    console.log('rewards validation', data.rewards);
    if (data.type !== 'project') {
      if (!data.rewards || Object.keys(data.rewards).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Rewards is required for fixed compensation type',
          path: ['rewards'],
        });
      }
    }

    if (data.rewards) {
      const totalRewards = Object.entries(data.rewards).reduce(
        (sum, [pos, value]) => {
          if (isNaN(value)) return sum;

          if (Number(pos) === BONUS_REWARD_POSITION) {
            return sum + value * (data.maxBonusSpots || 0);
          }
          return sum + value;
        },
        0,
      );
      if (data.type !== 'project' && totalRewards !== data.rewardAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total of rewards must equal the reward amount',
          path: ['rewards'],
        });
      }

      if (!!data.rewards?.[BONUS_REWARD_POSITION] && !data.maxBonusSpots) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          path: ['maxBonusSpots'],
          message: 'Required',
          minimum: 1,
          inclusive: true,
          type: 'number',
        });
      }
    }
  }

  if (data.compensationType === 'range') {
    if (!data.minRewardAsk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['minRewardAsk'],
      });
    }
    if (!data.maxRewardAsk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['maxRewardAsk'],
      });
    }
    if (
      data.minRewardAsk &&
      data.maxRewardAsk &&
      data.maxRewardAsk < data.minRewardAsk
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum reward must be greater than minimum reward',
        path: ['maxRewardAsk'],
      });
    }
  }

  if (data.type === 'hackathon') {
    if (
      !hackathon?.deadline ||
      data.deadline !== new Date(hackathon?.deadline).toISOString()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hackathon deadline cannot be changed',
        path: ['deadline'],
      });
    }
  }
};

// use this for any logic that needs nullification (or shouldnt hinder frontend)
export const backendListingRefinements = async (
  data: ListingFormData,
  ctx: z.RefinementCtx,
) => {
  if (data.type !== 'project' && data.compensationType !== 'fixed') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'Selected Type is not allowed to have compensation type other than fixed',
      path: ['compensationType'],
    });
  }
  // consdiers VARIABLE Compensation too
  if (data.compensationType !== 'range') {
    if (data.minRewardAsk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Should be empty',
        path: ['minRewardAsk'],
      });
    }
    if (data.maxRewardAsk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Should be empty',
        path: ['maxRewardAsk'],
      });
    }
  }

  // consdiers VARIABLE Compensation too
  if (data.compensationType !== 'fixed') {
    if (data.rewards) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Should be empty',
        path: ['rewards'],
      });
    }
    if (data.rewardAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Should be empty',
        path: ['rewardAmount'],
      });
    }
    if (data.maxBonusSpots) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Should be empty',
        path: ['maxBonusSpots'],
      });
    }
  }
};
