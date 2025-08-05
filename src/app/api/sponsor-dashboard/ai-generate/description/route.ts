import { openrouter } from '@openrouter/ai-sdk-provider';
import { createDataStreamResponse, smoothStream, streamText } from 'ai';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import logger from '@/lib/logger';
import { aiGenerateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { aiGenerateFormSchema } from '@/features/listing-builder/components/AiGenerate/schema';

import { getDescriptionPrompt } from './prompts';

export async function POST(req: NextRequest) {
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
      routeName: 'aiGenerateDescription',
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawData = await req.json();
    logger.debug(`Request body: ${safeStringify(rawData)}`);
    const validatedData = aiGenerateFormSchema.parse(rawData);

    const prompt = getDescriptionPrompt(validatedData);

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: openrouter('google/gemini-2.5-flash', {
            extraBody: {
              plugins: [
                {
                  id: 'web',
                  max_results: 3,
                },
              ],
            },
          }),
          system:
            'You are a professional content writer specializing in creating clear, concise, and compelling project descriptions for bounties and freelance opportunities.',
          prompt,
          experimental_transform: smoothStream({ chunking: 'word' }),
          headers: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL,
            'X-Title': 'Superteam Earn - AI Listing Builder',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream);
      },
      onError: () => {
        logger.error('Error in streamed response while generating description');
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error('Validation error:', safeStringify(error.errors));
      return new Response(
        JSON.stringify({
          error: 'Invalid input data',
          details: error.flatten(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    logger.error('Error generating description:', safeStringify(error));
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({
        error: 'Failed to generate description',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
