import { openrouter } from '@openrouter/ai-sdk-provider';
import { BountyType } from '@prisma/client';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { eligibilityQuestionSchema } from '@/features/listing-builder/types/schema';

import { generateListingQuestionsPrompt } from './prompts';

const requestBodySchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'),
  inputRequirements: z.string().min(1, 'Input Requrements cannot be empty'),
  type: z.nativeEnum(BountyType),
});

export async function POST(request: Request) {
  try {
    let description: string, type: BountyType, inputRequirements: string;
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
      inputRequirements = parsedBody.data.inputRequirements;
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

    const prompt = generateListingQuestionsPrompt(
      description,
      inputRequirements,
      type,
    );

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.5-pro-preview-03-25', {
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

    console.log('Generated eligibility questions object: ', object);

    return NextResponse.json(object.eligibilityQuestions, { status: 200 });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: 'Failed to generate eligibility questions' },
      { status: 500 },
    );
  }
}
