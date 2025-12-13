import {
  type ParentSkills,
  skillSubSkillMap,
  type SubSkillsType,
} from '@/interface/skills';

/**
 * Generates a URL-friendly slug from a skill name
 */
export function generateSkillSlug(name: string): string {
  // Handle special characters before slugification
  const slug = name
    .toLowerCase()
    // Replace + with plus (handles C++, C#, etc.)
    .replace(/\+/g, 'plus')
    // Replace # with sharp (handles C#, F#, etc.)
    .replace(/#/g, 'sharp')
    // Replace . with dot (handles .NET, Node.js, etc.)
    .replace(/\./g, 'dot')
    // Replace spaces and other non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  return slug;
}

/**
 * Finds a skill by its slug, returning information about whether it's a parent or subskill
 */
export function findSkillBySlug(
  slug: string,
):
  | { type: 'parent'; name: ParentSkills }
  | { type: 'subskill'; name: SubSkillsType; parent: ParentSkills }
  | null {
  // Normalize the incoming slug - handle URL encoding and special characters
  // Replace + with plus (in case it comes through URL encoded or decoded)
  const normalizedSlug = slug
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/#/g, 'sharp')
    .replace(/\./g, 'dot');

  // Check if it's a parent skill
  const parentSkills = Object.keys(skillSubSkillMap) as ParentSkills[];
  for (const parentSkill of parentSkills) {
    if (generateSkillSlug(parentSkill) === normalizedSlug) {
      return { type: 'parent', name: parentSkill };
    }
  }

  // Check if it's a subskill
  for (const [parentSkill, subSkills] of Object.entries(skillSubSkillMap)) {
    for (const subSkill of subSkills) {
      if (generateSkillSlug(subSkill.value) === normalizedSlug) {
        return {
          type: 'subskill',
          name: subSkill.value as SubSkillsType,
          parent: parentSkill as ParentSkills,
        };
      }
    }
  }

  return null;
}

/**
 * Gets all valid skill slugs (both parent and subskills) for URL validation
 */
export function getAllSkillSlugs(): readonly string[] {
  const parentSlugs = Object.keys(skillSubSkillMap).map((skill) =>
    generateSkillSlug(skill),
  );

  const subskillSlugs = Object.values(skillSubSkillMap).flatMap((subSkills) =>
    subSkills.map((s) => generateSkillSlug(s.value)),
  );

  return [...parentSlugs, ...subskillSlugs];
}

/**
 * Gets only parent skill slugs (Frontend, Backend, etc.) for sitemap generation
 * Excludes subskills since they may have few/no listings
 */
export function getParentSkillSlugs(): readonly string[] {
  return Object.keys(skillSubSkillMap).map((skill) => generateSkillSlug(skill));
}
