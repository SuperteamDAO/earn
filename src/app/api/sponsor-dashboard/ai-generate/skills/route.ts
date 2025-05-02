import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { skillsArraySchema } from '@/interface/skills';
import logger from '@/lib/logger';
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

export async function POST(request: Request) {
  try {
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

    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const prompt = generateListingSkillsPrompt(description);

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-pro-preview-03-25', {
        reasoning: {
          effort: 'medium',
        },
      }),
      system:
        'Your role is to generate proper skills for listings, strictly adhering to the rules provided with each description and type.',
      prompt,
      schema: responseSchema,
    });

    logger.info('Generated skills object: ', safeStringify(object));

    return NextResponse.json(object.skills, { status: 200 });
  } catch (error) {
    logger.error('Error generating skills:', safeStringify(error));
    return NextResponse.json(
      { error: 'Failed to generate skills' },
      { status: 500 },
    );
  }
}
