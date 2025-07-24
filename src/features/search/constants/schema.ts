import z from 'zod';

export const SearchStatusSchema = z.enum(['OPEN', 'REVIEW', 'CLOSED']);
export const SearchSkillsSchema = z.enum([
  'DEVELOPMENT',
  'DESIGN',
  'CONTENT',
  'OTHER',
]);

export type SearchStatus = z.infer<typeof SearchStatusSchema>;
export type SearchSkills = z.infer<typeof SearchSkillsSchema>;
