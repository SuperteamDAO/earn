import { openrouter } from '@openrouter/ai-sdk-provider';
import { convertToModelMessages, streamText } from 'ai';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import logger from '@/lib/logger';
import { aiGenerateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { autoGenerateChatSchema } from '@/features/listing-builder/components/AutoGenerate/schema';

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

    const parsed = await autoGenerateChatSchema.parseAsync(await req.json());
    const {
      messages,
      listingType,
      company,
      token,
      tokenUsdAmount,
      hackathonName,
    } = parsed;
    logger.debug('Request body: ', safeStringify(parsed));

    const systemPrompt = getDescriptionPrompt(listingType, {
      company,
      token,
      tokenUsdAmount,
      hackathonName,
    });

    const modelMessages = await convertToModelMessages(messages);
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
      system: systemPrompt,
      messages: modelMessages,
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL,
        'X-Title': 'Superteam Earn - AI Listing Builder',
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error('Validation error:', safeStringify(error.issues));
      return new Response(
        JSON.stringify({
          error: 'Invalid input data',
          details: z.flattenError(error),
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
