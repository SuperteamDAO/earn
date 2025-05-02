import { openrouter } from '@openrouter/ai-sdk-provider';
import { BountyType, CompensationType } from '@prisma/client';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import {
  MAX_BONUS_SPOTS,
  MAX_REWARD,
} from '@/features/listing-builder/constants';

import { generateListingRewardsPrompt } from './prompts';

const requestBodySchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'),
  inputReward: z.string().min(1, 'Input Reward cannot be empty'),
  type: z.nativeEnum(BountyType),
  token: z.string(),
  tokenUsdValue: z.number(),
});
export type RewardInputSchema = z.infer<typeof requestBodySchema>;

const responseSchema = z.object({
  compensationType: z.nativeEnum(CompensationType).default('fixed'),
  maxBonusSpots: z.coerce
    .number()
    .min(0)
    .max(MAX_BONUS_SPOTS)
    .optional()
    .nullable(),
  minRewardAsk: z.coerce.number().min(0).max(MAX_REWARD),
  maxRewardAsk: z.coerce.number().min(0).max(MAX_REWARD),
  rewards: z
    .array(
      z.object({
        rank: z.string().describe(`The rank (e.g., '1' for 1st place)`),
        amount: z.coerce
          .number()
          .min(0.01)
          .max(MAX_REWARD)
          .describe('The reward amount for this rank'),
      }),
    )
    .describe(
      'An array of reward objects, each specifying a rank and amount. Empty if no ranked rewards.',
    ),
});

type TRewardsGenerateResponseInternal = z.infer<typeof responseSchema>;

export type TRewardsGenerateResponse = Omit<
  TRewardsGenerateResponseInternal,
  'rewards'
> & {
  rewards: Record<string, number>;
};
export async function POST(request: Request) {
  try {
    let input: RewardInputSchema;
    try {
      const body = await request.json();
      logger.debug(`Request body: ${safeStringify(body)}`);
      const parsedBody = requestBodySchema.safeParse(body);

      if (!parsedBody.success) {
        logger.error(
          'Invalid request body',
          safeStringify(parsedBody.error.errors),
        );
        return NextResponse.json(
          { error: 'Invalid request body', details: parsedBody.error.errors },
          { status: 400 },
        );
      }
      input = parsedBody.data;
    } catch (e) {
      if (e instanceof SyntaxError) {
        logger.error('Invalid JSON in request body');
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 },
        );
      }
      throw e;
    }

    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const prompt = generateListingRewardsPrompt(input);

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-pro-preview-03-25', {
        reasoning: {
          effort: 'medium',
        },
      }),
      system:
        'Your role is to generate proper rewards for listings, strictly adhering to the rules provided with each description and type.',
      prompt,
      schema: responseSchema,
    });

    logger.info('Generated rewards object: ', safeStringify(object));

    const rewardsRecord: Record<string, number> = object.rewards.reduce(
      (acc, rewardItem) => {
        acc[rewardItem.rank] = rewardItem.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const finalResponse: TRewardsGenerateResponse = {
      ...object,
      rewards: rewardsRecord,
    };

    return NextResponse.json(finalResponse, { status: 200 });
  } catch (error) {
    logger.error('Error generating rewards:', safeStringify(error));
    return NextResponse.json(
      { error: 'Failed to generate rewards' },
      { status: 500 },
    );
  }
}
