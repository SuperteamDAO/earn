import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { aiGenerateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { BountyType } from '@/prisma/enums';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';

import { generateListingTitlePrompt } from './prompt';

const requestBodySchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'),
  type: z.nativeEnum(BountyType),
});

const responseSchema = z.object({
  title: z.string().min(1).max(100),
});
export type TTitleGenerateResponse = z.infer<typeof responseSchema>;
const AI_GENERATION_TIMEOUT_MS = 15000;

const getFallbackTitle = (
  _description: string,
  type: BountyType,
): TTitleGenerateResponse => {
  const typeLabel = type.replace(/_/g, ' ').trim();

  return {
    title: `${typeLabel} Opportunity`.slice(0, 100),
  };
};

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
      routeName: 'aiGenerateTitle',
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let description: string, type: BountyType;
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

    const prompt = generateListingTitlePrompt(description, type);

    const generateTitleWithModel = async (modelName: string) => {
      const { object } = await generateObject({
        model: openrouter(modelName),
        system:
          'You generate concise, compelling listing titles for provided listing description. Follow the prompt rules and strictly satisfy the response schema.',
        prompt,
        schema: responseSchema as any,
        abortSignal: AbortSignal.timeout(AI_GENERATION_TIMEOUT_MS),
      });
      return object;
    };

    let object: TTitleGenerateResponse;
    try {
      object = await generateTitleWithModel('google/gemini-2.5-flash');
      logger.info(
        'Generated eligibility title object with primary model: ',
        safeStringify(object),
      );
    } catch (primaryModelError) {
      logger.warn(
        'Primary title model failed, trying fallback model:',
        safeStringify(primaryModelError),
      );
      try {
        object = await generateTitleWithModel(
          'google/gemini-2.0-flash-lite-001',
        );
        logger.info(
          'Generated eligibility title object with fallback model: ',
          safeStringify(object),
        );
      } catch (fallbackModelError) {
        logger.error(
          'Both title models failed. Returning deterministic fallback. Primary error:',
          safeStringify(primaryModelError),
          'Fallback error:',
          safeStringify(fallbackModelError),
        );
        object = getFallbackTitle(description, type);
      }
    }

    return NextResponse.json(object, { status: 200 });
  } catch (error) {
    logger.error('Error generating title:', safeStringify(error));
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 },
    );
  }
}
