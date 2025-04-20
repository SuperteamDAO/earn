import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { skillsArraySchema } from '@/interface/skills';

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
      const parsedBody = requestBodySchema.safeParse(body);

      if (!parsedBody.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsedBody.error.errors },
          { status: 400 },
        );
      }
      description = parsedBody.data.description;
    } catch (e) {
      if (e instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 },
        );
      }
      throw e;
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

    console.log('Generated eligibility skills object: ', object);

    return NextResponse.json(object.skills, { status: 200 });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: 'Failed to generate eligibility questions' },
      { status: 500 },
    );
  }
}
