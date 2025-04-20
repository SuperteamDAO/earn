import { openrouter } from '@openrouter/ai-sdk-provider';
import { createDataStreamResponse, smoothStream, streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { aiGenerateFormSchema } from '@/features/listing-builder/components/AiGenerate/schema';

import { getDescriptionPrompt } from './prompts';

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validatedData = aiGenerateFormSchema.parse(rawData);

    const prompt = getDescriptionPrompt(validatedData);

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: openrouter('google/gemini-2.0-flash-001'),
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
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.errors);
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

    console.error('Error generating description:', error);
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
