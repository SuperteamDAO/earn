import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { eligibilityQuestionSchema } from '@/features/listing-builder/types/schema';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { description }: { description: string } = req.body;

    const prompt = `
Generate few but most relevant questions for a bounty or project based on the following description:

Description: 
${description}
`;

    const { object } = await generateObject({
      model: openrouter('google/gemini-2.0-flash-001'),
      system:
        'You are a professional content writer specializing in creating clear, concise, and compelling project eligibility questions for bounties and freelance opportunities.',
      prompt,
      schema: z.object({
        eligibilityQuestions: z.array(
          eligibilityQuestionSchema.omit({ optional: true }),
        ),
      }),
    });

    console.log('object  - ', object);

    return res.status(200).json(object.eligibilityQuestions);
  } catch (error) {
    console.error('Error generating description:', error);
    return res.status(500).json({ error: 'Failed to generate description' });
  }
}
