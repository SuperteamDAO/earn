import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { tokenList } from '@/constants/tokenList';

import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';

import { generateListingTokenPrompt } from './prompt';

const requestBodySchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'),
});

const responseSchema = z.object({
  token: z
    .enum(
      tokenList.map((token) => token.tokenSymbol) as [string, ...string[]],
      {
        errorMap: () => ({ message: 'Token Not Allowed' }),
      },
    )
    .default('USDC'),
});
export type TTokenGenerateResponse = z.infer<typeof responseSchema>;

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

    const session = await getSponsorSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const prompt = generateListingTokenPrompt(description);

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.0-flash-lite-001'),
      system: 'Your role is to extract the token mentioned in the listings.',
      prompt,
      schema: responseSchema,
    });

    console.log('Generated eligibility token object: ', object);

    return NextResponse.json(object, { status: 200 });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 },
    );
  }
}
