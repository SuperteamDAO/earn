import { z } from 'zod';

import { skillsArraySchema } from '@/interface/skills';
import { CompensationType, status } from '@/prisma/enums';
import { canonicalizeRegionValue } from '@/utils/canonicalRegion';
import { dayjs } from '@/utils/dayjs';

import {
  emailRegex,
  telegramRegex,
  twitterRegex,
} from '@/features/social/utils/regex';

import type { ListingFormData, ValidationFields } from '.';
import {
  BONUS_REWARD_POSITION,
  DEADLINE_FORMAT,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  MAX_REWARD,
} from '../constants';
import type { BuilderHackathon } from './builder';

const noHtmlDelimiters = (value: string) => !/[<>]/.test(value);
const noHtmlMessage = 'HTML characters are not allowed';

export const eligibilityQuestionSchema = z.object({
  order: z.number(),
  question: z
    .string()
    .trim()
    .min(1, 'Please add your question')
    .max(200, 'Please limit your question to 200 characters max.'),
  type: z.enum(['text', 'link']),
  optional: z.boolean().optional().nullable(),
});
export type TEligibilityQuestion = z.infer<typeof eligibilityQuestionSchema>;

interface ListingFormSchemaOptions {
  isGod: boolean;
  isEditing: boolean;
  isST: boolean;
  pastListing?: { deadline?: string | Date | null };
  hackathons?: BuilderHackathon[];
}
export const createListingFormSchema = ({
  isGod,
  isEditing,
  isST,
  pastListing,
  hackathons,
}: ListingFormSchemaOptions) => {
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
        const sortedPositions = regularPositions.toSorted((a, b) => a - b);
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
        Object.entries(rewards).map(([key, value]) => [key, value]),
      );
    });

  return z
    .object({
      id: z.string().optional().nullish(),
      title: z
        .string()
        .trim()
        .min(1, 'Required')
        .max(80)
        .refine(noHtmlDelimiters, noHtmlMessage),
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
        .enum(['bounty', 'hackathon'])
        .default('bounty')
        .refine((data) => {
          if (data === 'hackathon') {
            return !!hackathons && hackathons.length > 0;
          }
          return true;
        }, 'Hackathon is not allowed for now'),
      region: z
        .string()
        .trim()
        .min(1)
        .max(256)
        .default('Global')
        .transform(canonicalizeRegionValue),
      referredBy: z.string().trim().min(1).max(256).optional().nullable(),
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
      commitmentDate: z
        .string()
        .trim()
        .datetime({
          message: 'Required',
          local: true,
          offset: true,
        })
        .min(1, 'Required'),
      templateId: z.string().optional().nullable(),
      eligibility: z.array(eligibilityQuestionSchema).optional().nullable(),
      skills: skillsArraySchema,

      token: z
        .string()
        .trim()
        .min(1, 'Token Not Allowed')
        .default(isST ? 'USDG' : 'USDC'),
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
      minRewardAsk: z
        .number()
        .min(0)
        .max(MAX_REWARD)
        .refine(
          (val) => {
            if (val === null || val === undefined) return true;
            const decimalPlaces = (val.toString().split('.')[1] || '').length;
            return decimalPlaces <= 4;
          },
          { message: 'Maximum 4 decimal places allowed' },
        )
        .optional()
        .nullable(),
      maxRewardAsk: z
        .number()
        .min(0)
        .max(MAX_REWARD)
        .refine(
          (val) => {
            if (val === null || val === undefined) return true;
            const decimalPlaces = (val.toString().split('.')[1] || '').length;
            return decimalPlaces <= 4;
          },
          { message: 'Maximum 4 decimal places allowed' },
        )
        .optional()
        .nullable(),
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
            if (value && !isST) {
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
      isFeatured: z.boolean().optional().nullable(),
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
      void createListingRefinements(data, ctx, hackathons);
    });
};

export const createListingRefinements = async (
  data: ListingFormData,
  ctx: z.RefinementCtx,
  hackathons?: BuilderHackathon[],
  pick?: ValidationFields,
) => {
  if (data.compensationType === 'fixed') {
    if (!data.rewardAmount) {
      if ((!!pick && pick.rewards) || !pick) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please fill in the rewards',
          path: ['rewards'],
        });
      }
      if ((!!pick && pick.rewardAmount) || !pick) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Required',
          path: ['rewardAmount'],
        });
      }
    }
    if (!data.rewards || Object.keys(data.rewards).length === 0) {
      if ((!!pick && pick.rewards) || !pick) {
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
      // Use epsilon comparison for floating point precision tolerance
      const epsilon = 0.0001;
      const rewardsDifference = Math.abs(
        totalRewards - (data.rewardAmount || 0),
      );
      if (rewardsDifference > epsilon) {
        if ((!!pick && pick.rewards) || !pick) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Total of rewards must equal the reward amount',
            path: ['rewards'],
          });
        }
      }

      if (!!data.rewards?.[BONUS_REWARD_POSITION] && !data.maxBonusSpots) {
        if ((!!pick && pick.maxBonusSpots) || !pick) {
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
  }

  if (data.type === 'hackathon' && data.deadline && data.hackathonId) {
    const currentHackathon = hackathons?.find((s) => s.id === data.hackathonId);
    if (
      !currentHackathon?.deadline ||
      data.deadline !== new Date(currentHackathon?.deadline).toISOString()
    ) {
      if ((!!pick && pick.deadline) || !pick) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Hackathon deadline cannot be changed',
          path: ['deadline'],
        });
      }
    }
  }

  if (data.commitmentDate && data.deadline) {
    const deadline = dayjs(data.deadline);
    const min = deadline.add(1, 'day');
    const max = deadline.add(30, 'day');
    const selected = dayjs(data.commitmentDate);
    if (selected.isBefore(min)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Winner announcement date must be at least 1 day after the deadline',
        path: ['commitmentDate'],
      });
    }
    if (selected.isAfter(max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Winner announcement date must be no more than 30 days after the deadline',
        path: ['commitmentDate'],
      });
    }
  }
};
