import { openrouter } from '@openrouter/ai-sdk-provider';
import { BountyType, CompensationType } from '@prisma/client';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { tokenList } from '@/constants/tokenList';

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
});

const responseSchema = z.object({
  token: z
    .enum(
      tokenList.map((token) => token.tokenSymbol) as [string, ...string[]],
      {
        errorMap: () => ({ message: 'Token Not Allowed' }),
      },
    )
    .default('USDC'),
  compensationType: z.nativeEnum(CompensationType).default('fixed'),
  maxBonusSpots: z.coerce
    .number()
    .min(0)
    .max(MAX_BONUS_SPOTS)
    .optional()
    .nullable(),
  minRewardAsk: z.coerce.number().min(0).max(MAX_REWARD).optional().nullable(),
  maxRewardAsk: z.coerce.number().min(0).max(MAX_REWARD).optional().nullable(),
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
    let description: string, type: BountyType, inputReward: string;
    try {
      const body = await request.json();
      const parsedBody = requestBodySchema.safeParse(body);

      if (!parsedBody.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsedBody.error.errors },
          { status: 400 },
        );
      }
      description = parsedBody.data.description;
      type = parsedBody.data.type;
      inputReward = parsedBody.data.inputReward;
    } catch (e) {
      if (e instanceof SyntaxError) {
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

    const prompt = generateListingRewardsPrompt(description, inputReward, type);

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

    console.log('Generated eligibility rewards object: ', object);

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
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: 'Failed to generate eligibility questions' },
      { status: 500 },
    );
  }
}
