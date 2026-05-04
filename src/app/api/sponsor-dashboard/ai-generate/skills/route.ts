import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { skillsArraySchema } from '@/interface/skills';
import logger from '@/lib/logger';
import { aiGenerateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { safeStringify } from '@/utils/safeStringify';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';

import { generateListingSkillsPrompt } from './prompts';

const requestBodySchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'),
});

const responseSchema = z.object({
  skills: skillsArraySchema,
});
export type TSkillsGenerateResponse = z.infer<typeof responseSchema>;
const AI_GENERATION_TIMEOUT_MS = 15000;

const getFallbackSkills = (
  _description: string,
): TSkillsGenerateResponse['skills'] => {
  return [{ skills: 'Other', subskills: ['Product Manager'] }];
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
      routeName: 'aiGenerateSkills',
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

    const prompt = generateListingSkillsPrompt(description);

    const generateSkillsWithModel = async (modelName: string) => {
      const { object } = await generateObject({
        model: openrouter(modelName),
        system:
          'Your role is to generate proper skills for listings, strictly adhering to the rules provided with each description and type.',
        prompt,
        schema: responseSchema as any,
        abortSignal: AbortSignal.timeout(AI_GENERATION_TIMEOUT_MS),
      });
      return object.skills;
    };

    let generatedSkills: TSkillsGenerateResponse['skills'];
    try {
      generatedSkills = await generateSkillsWithModel(
        'google/gemini-2.5-flash',
      );
      logger.info(
        'Generated skills object with primary model: ',
        safeStringify(generatedSkills),
      );
    } catch (primaryModelError) {
      logger.warn(
        'Primary skills model failed, trying fallback model:',
        safeStringify(primaryModelError),
      );
      try {
        generatedSkills = await generateSkillsWithModel(
          'google/gemini-2.0-flash-lite-001',
        );
        logger.info(
          'Generated skills object with fallback model: ',
          safeStringify(generatedSkills),
        );
      } catch (fallbackModelError) {
        logger.error(
          'Both skills models failed. Returning deterministic fallback. Primary error:',
          safeStringify(primaryModelError),
          'Fallback error:',
          safeStringify(fallbackModelError),
        );
        generatedSkills = getFallbackSkills(description);
      }
    }

    return NextResponse.json(generatedSkills, { status: 200 });
  } catch (error) {
    logger.error('Error generating skills:', safeStringify(error));
    return NextResponse.json(
      { error: 'Failed to generate skills' },
      { status: 500 },
    );
  }
}
