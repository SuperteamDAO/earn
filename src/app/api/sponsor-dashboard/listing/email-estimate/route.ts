import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  type ParentSkills,
  skillsArraySchema,
  skillSubSkillMap,
} from '@/interface/skills';
import { prisma } from '@/prisma';

import { getCombinedRegion } from '@/features/listings/utils/region';

const DEV_PARENTS = ['Frontend', 'Backend', 'Blockchain', 'Mobile'] as const;

const BodySchema = z.object({
  skills: skillsArraySchema,
  region: z.string().optional().nullable(),
});

/**
 * Get email estimate count for given skills and region
 * Returns the number of users who match the skills and region criteria
 */
export async function getEmailEstimate(
  skills: z.infer<typeof skillsArraySchema>,
  region?: string | null,
): Promise<number> {
  const mainSkills = skills.map((s) => s.skills);
  const subSkills = skills.flatMap((s) => s.subskills);

  const devParentsSet = new Set<string>(DEV_PARENTS as unknown as string[]);
  const selectedDevParents = Array.from(
    new Set(mainSkills.filter((p) => devParentsSet.has(p))),
  );

  const nonDevParents = Object.keys(skillSubSkillMap).filter(
    (p) => !devParentsSet.has(p),
  ) as ParentSkills[];

  const nonDevSubskillsSet = new Set<string>(
    nonDevParents.flatMap((p) =>
      skillSubSkillMap[p].map((s) => s.value as string),
    ),
  );

  const selectedNonDevSubs = Array.from(
    new Set(subSkills.filter((s) => nonDevSubskillsSet.has(s))),
  );

  const developmentSkillConditions = selectedDevParents.map((skill) => ({
    skills: { path: '$[*].skills', array_contains: skill },
  }));

  const nonDevelopmentSubSkillConditions = selectedNonDevSubs.map(
    (subskill) => ({
      skills: { path: '$[*].subskills', array_contains: subskill },
    }),
  );

  const orConditions = [
    ...developmentSkillConditions,
    ...nonDevelopmentSubSkillConditions,
  ];

  if (orConditions.length === 0) {
    return 0;
  }

  const regionObject = getCombinedRegion(region || 'GLOBAL');
  const countries = regionObject?.country || [];

  const count = await prisma.user.count({
    where: {
      isTalentFilled: true,
      emailSettings: { some: { category: 'createListing' } },
      OR: orConditions,
      ...(regionObject?.country && {
        location: { in: countries },
      }),
    },
  });

  return count;
}

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
