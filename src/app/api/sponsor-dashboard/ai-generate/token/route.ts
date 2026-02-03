import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject, zodSchema } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { aiGenerateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';

import { generateListingTokenPrompt } from './prompt';

const requestBodySchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'),
});
const responseSchema = z.object({
  token: z.string().optional().nullable(),
});

export type TTokenGenerateResponse = z.infer<typeof responseSchema>;

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
      routeName: 'aiGenerateToken',
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let description: string;
    try {
      const body = await request.json();
      logger.debug(`Request body: ${safeStringify(body)}`);
      const parsedBody = requestBodySchema.safeParse(body);

      if (!parsedBody.success) {
        logger.error(
          'Invalid request body',
          safeStringify(parsedBody.error.issues),
        );
        return NextResponse.json(
          { error: 'Invalid request body', details: parsedBody.error.issues },
          { status: 400 },
        );
      }
      description = parsedBody.data.description;
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

    const prompt = generateListingTokenPrompt(description);

    let object: TTokenGenerateResponse;

    try {
      const result = await generateObject({
        model: openrouter('openai/gpt-oss-120b', {
          provider: {
            only: ['baseten'],
            allow_fallbacks: true,
          },
        }),
        prompt,
        schema: zodSchema(responseSchema),
        system: 'Your role is to extract the token mentioned in the listings.',
      });
      object = responseSchema.parse(result.object);
      logger.info(
        'Generated eligibility token object with primary model: ',
        safeStringify(object),
      );
    } catch (primaryModelError) {
      logger.warn(
        'Primary model failed, attempting fallback model:',
        safeStringify(primaryModelError),
      );

      try {
        const result = await generateObject({
          model: openrouter('google/gemini-2.0-flash-lite-001'),
          prompt,
          schema: zodSchema(responseSchema),
          system:
            'Your role is to extract the token mentioned in the listings.',
        });
        object = responseSchema.parse(result.object);
        logger.info(
          'Generated eligibility token object with fallback model: ',
          safeStringify(object),
        );
      } catch (fallbackModelError) {
        logger.error(
          'Both primary and fallback models failed. Primary error:',
          safeStringify(primaryModelError),
          'Fallback error:',
          safeStringify(fallbackModelError),
        );
        throw fallbackModelError;
      }
    }

    return NextResponse.json(object, { status: 200 });
  } catch (error) {
    logger.error('Error generating token:', safeStringify(error));
    console.log(error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 },
    );
  }
}
