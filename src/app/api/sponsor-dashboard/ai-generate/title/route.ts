import { openrouter } from '@openrouter/ai-sdk-provider';
import { BountyType } from '@prisma/client';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
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

export async function POST(request: Request) {
  try {
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

    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const prompt = generateListingTitlePrompt(description, type);

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.0-flash-lite-001'),
      system: 'Your role is to extract the token mentioned in the listings.',
      prompt,
      schema: responseSchema,
    });

    logger.info('Generated eligibility title object: ', safeStringify(object));

    return NextResponse.json(object, { status: 200 });
  } catch (error) {
    logger.error('Error generating title:', safeStringify(error));
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 },
    );
  }
}
