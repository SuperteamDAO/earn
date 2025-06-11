import {
  BountyType,
  CompensationType,
  type Hackathon,
  Regions,
  status,
} from '@prisma/client';
import { z } from 'zod';

import { PROJECT_NAME } from '@/constants/project';
import { tokenList } from '@/constants/tokenList';
import { skillsArraySchema } from '@/interface/skills';
import { dayjs } from '@/utils/dayjs';

import { type Listing } from '@/features/listings/types';
import {
  emailRegex,
  telegramRegex,
  twitterRegex,
} from '@/features/social/utils/regex';

import { DEADLINE_FORMAT } from '../components/Form/Deadline';
import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  MAX_REWARD,
} from '../constants';
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
    question: z.string().trim().min(1, 'Please add your question').max(512),
    type: z.enum(['text', 'link', 'paragraph', 'checkbox']),
    description: z.string().optional().nullable(),
    optional: z
      .boolean()
      .optional()
      .nullable()
      .default(false)
      .transform((val) => val ?? false),
  });

  const rewardsSchema = z
    .record(
      z.coerce.number(),
      z
        .number({
          message: 'Required',
        })
        .min(0.01, 'Required')
        .max(MAX_REWARD),
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
      id: z.string().optional().nullish(),
      title: z.string().trim().min(1, 'Required').max(100),
      slug: z
        .string()
        .trim()
        .min(1, 'Required')
        .max(120)
        .regex(
          /^-*[a-z0-9]+(?:-[a-z0-9]+)*-*$/,
          'Slug should only contain lowercase alphabets, numbers, and hyphens',
        )
        .transform((val) => val.replace(/^[-\s]+|[-\s]+$/g, '')),
      // we cannot call slug check api here,
      // coz once slug is dirty, any field other change will also trigger this
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
          offset: true,
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
      eligibility: z.array(eligibilityQuestionSchema).optional().nullable(),
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
        .max(MAX_REWARD)
        .optional()
        .nullable(),
      rewards: rewardsSchema.optional().nullable(),
      compensationType: z.nativeEnum(CompensationType).default('fixed'),
      minRewardAsk: z.number().min(0).max(MAX_REWARD).optional().nullable(),
      maxRewardAsk: z.number().min(0).max(MAX_REWARD).optional().nullable(),
      maxBonusSpots: z
        .number({
          message: 'Required',
        })
        .min(0)
        .max(
          MAX_BONUS_SPOTS,
          `# of Prizes cannot be more than ${MAX_BONUS_SPOTS}`,
        )
        .optional()
        .nullable(),
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
            message: `Foundation paying can only be enabled for ${PROJECT_NAME} listings`,
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
  if (data.compensationType === 'fixed') {
    if (!data.rewardAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please fill in the rewards',
        path: ['rewards'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['rewardAmount'],
      });
    }
    if (data.type !== 'project') {
      if (!data.rewards || Object.keys(data.rewards).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please fill in the rewards',
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

  if (data.type === 'sponsorship' && data.compensationType !== 'variable') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sponsorship must be variable compensation',
      path: ['compensationType'],
    });
  }

  if (data.token === 'Any' && data.compensationType !== 'variable') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Any token is only allowed for variable compensation',
      path: ['token'],
    });
  }

  if (data.token === 'Other') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        '`Other` token is not allowed as a base token. `Other` is a sub token for `Any` token',
      path: ['token'],
    });
  }

  if (data.eligibility && data.eligibility.length > 0) {
    for (const [index, question] of data.eligibility.entries()) {
      if (
        question.type === 'checkbox' &&
        question.description &&
        question.description !== ''
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Description is forbidden for checkbox questions',
          path: [`eligibility.${index}.question`],
        });
      }
    }
  }

  if (data.type === 'hackathon' && data.deadline) {
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

// used in backend APIs only, not on frontend,
// meant to not hinder UX (like cache rewards while switching between listing type or compensation type)
export const backendListingRefinements = async (
  data: ListingFormData,
  ctx: z.RefinementCtx,
) => {
  const slugUniqueCheck = async (slug: string, id?: string | null) => {
    try {
      await fetchSlugCheck({
        slug,
        id: id || undefined,
        check: true,
      });
      return true;
    } catch (error) {
      console.log(error);
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
  if (
    data.type !== 'project' &&
    data.type !== 'sponsorship' &&
    data.compensationType !== 'fixed'
  ) {
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
