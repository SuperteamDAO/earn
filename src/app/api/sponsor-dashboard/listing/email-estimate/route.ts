import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { skillsArraySchema } from '@/interface/skills';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { getEmailEstimate } from '@/features/listing-builder/components/Form/Boost/server-queries';

const BodySchema = z.object({
  skills: skillsArraySchema,
  region: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const session = await getUserSession(await headers());
  if (session.status !== 200 || !session.data) {
    return NextResponse.json(
      { error: session.error || 'Unauthorized' },
      { status: session.status || 401 },
    );
  }

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
