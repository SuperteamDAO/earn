import { type z } from 'zod';

import {
  type ParentSkills,
  type skillsArraySchema,
  skillSubSkillMap,
} from '@/interface/skills';
import { prisma } from '@/prisma';

import { buildFeaturedAvailabilityWhere } from '@/features/listing-builder/utils/featured-availability';
import { getCombinedRegion } from '@/features/listings/utils/region';

const DEV_PARENTS = ['Frontend', 'Backend', 'Blockchain', 'Mobile'] as const;

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

export async function getFeaturedAvailability(): Promise<boolean> {
  const count = await prisma.bounties.count({
    where: buildFeaturedAvailabilityWhere(),
  });
  return count < 2;
}
