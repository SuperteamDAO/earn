import { openrouter } from '@openrouter/ai-sdk-provider';
import { BountyType } from '@prisma/client';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { aiGenerateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { eligibilityQuestionSchema } from '@/features/listing-builder/types/schema';

import { generateListingQuestionsPrompt } from './prompts';

const requestBodySchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'),
  inputRequirements: z.string(),
  type: z.nativeEnum(BountyType),
});

export async function POST(request: Request) {
  try {
    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const userId = session.data.userId;

    const rateLimitResponse = await checkAndApplyRateLimitApp({
      limiter: aiGenerateRateLimiter,
      identifier: userId,
      routeName: 'aiGenerateQuestions',
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let description: string, type: BountyType, inputRequirements: string;
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
      description = parsedBody.data.description;
      type = parsedBody.data.type;
      inputRequirements = parsedBody.data.inputRequirements;
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

    const prompt = generateListingQuestionsPrompt(
      description,
      inputRequirements,
      type,
    );

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-pro-preview', {
        reasoning: {
          effort: 'low',
        },
      }),
      system:
        'Your role is to generate high-quality evaluation questions for listings, strictly adhering to the rules provided with each description and type.',
      prompt,
      schema: z.object({
        eligibilityQuestions: z.array(
          eligibilityQuestionSchema.omit({ optional: true }),
        ),
      }),
    });

    logger.info(
      'Generated eligibility questions object: ',
      safeStringify(object),
    );

    return NextResponse.json(object.eligibilityQuestions, { status: 200 });
  } catch (error) {
    logger.error(
      'Error generating eligibility questions:',
      safeStringify(error),
    );
    return NextResponse.json(
      { error: 'Failed to generate eligibility questions' },
      { status: 500 },
    );
  }
}
