import { openrouter } from '@openrouter/ai-sdk-provider';
import { createDataStreamResponse, smoothStream, streamText } from 'ai';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const { companyDescription, scopeOfWork, rewards, requirements } =
      await req.json();

    // Create a prompt from the form data
    const prompt = `
Generate a detailed description for a bounty or project based on the following information:

COMPANY/PROJECT DESCRIPTION:
${companyDescription}

SCOPE OF WORK:
${scopeOfWork}

REWARDS AND PODIUM SPLIT:
${rewards}

ELIGIBILITY/SUBMISSION REQUIREMENTS:
${requirements}

Please format the response with clear sections for:
1. An introduction paragraph about the company/project
2. Scope of Work section
3. Deliverables section with numbered list
4. Any other relevant information from the input

Keep the tone professional and engaging.
`;

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
    console.error('Error generating description:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate description' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
