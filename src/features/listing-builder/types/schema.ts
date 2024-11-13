import { BountyType, CompensationType, Regions, status } from '@prisma/client';
import { z } from 'zod';

import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  tokenList,
} from '@/constants';
import { emailRegex, telegramRegex, twitterRegex } from '@/features/talent';
import { skillsArraySchema } from '@/interface/skills';
import { dayjs } from '@/utils/dayjs';

import { DEADLINE_FORMAT } from '../components/Form';
import { fetchSlugCheck } from '../queries/slug-check';
import { type ListingFormData } from '.';

export const createListingRefinements = async (
  data: ListingFormData,
  ctx: z.RefinementCtx,
  isEditing: boolean,
) => {
  console.log('zod validating');
  const slugUniqueCheck = async (slug: string, id?: string) => {
    try {
      const listingId = isEditing ? id : null;
      await fetchSlugCheck({
        slug,
        id: listingId || undefined,
        check: true,
      });
      console.log('slug check?');
      return true;
    } catch (error) {
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
    if (data.type === 'bounty') {
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
        message: 'Minimum reward is required for range compensation type',
        path: ['minRewardAsk'],
      });
    }
    if (!data.maxRewardAsk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum reward is required for range compensation type',
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
};

export const createListingFormSchema = (
  isGod: boolean,
  isEditing: boolean,
  isST?: boolean,
) => {
  const eligibilityQuestionSchema = z.discriminatedUnion('type', [
    z.object({
      order: z.number(),
      question: z.string().min(1),
      type: z.literal('text'),
    }),
    z.object({
      order: z.number(),
      question: z.string().url(),
      type: z.literal('link'),
    }),
  ]);

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
      title: z.string().min(1, 'Required'),
      slug: z
        .string()
        .min(1, 'Required')
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
        .min(1, 'Required')
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
      description: z.string().min(1, 'Required'),
      type: z.nativeEnum(BountyType).default('bounty'),
      region: z.string().default(Regions.GLOBAL),
      deadline: z
        .string()
        .datetime({
          message: 'Required',
        })
        .min(1, 'Required')
        .default(dayjs().add(7, 'day').format(DEADLINE_FORMAT))
        .refine(
          (date) => isGod || dayjs(date).isAfter(dayjs()),
          'Deadline cannot be in the past',
        ),

      timeToComplete: z.string().optional(),
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

      // values that will not be set on any API, but useful for response
      isPublished: z.boolean().optional().nullable(),
      status: z.nativeEnum(status).optional().nullable(),
      publishedAt: z
        .union([z.string().datetime(), z.date(), z.null()])
        .optional(),
      sponsorId: z.string().optional(),
      hackathonId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      createListingRefinements(data, ctx, isEditing);
    });
};
