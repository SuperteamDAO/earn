import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
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
          safeStringify(parsedBody.error.errors),
        );
        return NextResponse.json(
          { error: 'Invalid request body', details: parsedBody.error.errors },
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

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.0-flash-lite-001'),
      prompt,
      schema: responseSchema,
      system: 'Your role is to extract the token mentioned in the listings.',
    });

    logger.info('Generated eligibility token object: ', safeStringify(object));

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
