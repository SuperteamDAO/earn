import { NextResponse } from 'next/server';
import { z } from 'zod';

import { skillsArraySchema } from '@/interface/skills';

import { getEmailEstimate } from '@/features/listing-builder/components/Form/Boost/server-queries';

const BodySchema = z.object({
  skills: skillsArraySchema,
  region: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { skills, region } = BodySchema.parse(json);

    const count = await getEmailEstimate(skills, region);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('email-estimate error', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
