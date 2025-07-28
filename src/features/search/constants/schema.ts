import { z } from 'zod';

export const SearchStatusSchema = z.enum(['OPEN', 'REVIEW', 'CLOSED']);
export const SearchSkillsSchema = z.enum([
  'DEVELOPMENT',
  'DESIGN',
  'CONTENT',
  'OTHER',
]);

export type SearchStatus = z.infer<typeof SearchStatusSchema>;
export type SearchSkills = z.infer<typeof SearchSkillsSchema>;

export const skillsData: Array<{ label: string; value: SearchSkills }> = [
  { label: 'Content', value: 'CONTENT' },
  { label: 'Design', value: 'DESIGN' },
  { label: 'Development', value: 'DEVELOPMENT' },
  { label: 'Others', value: 'OTHER' },
];

export const statusData: Array<{
  label: string;
  value: SearchStatus;
  circleClasses: {
    border: string;
    bg: string;
  };
}> = [
  {
    label: 'Open',
    value: 'OPEN',
    circleClasses: {
      border: 'border-emerald-600/40',
      bg: 'bg-green-500',
    },
  },
  {
    label: 'In Review',
    value: 'REVIEW',
    circleClasses: {
      border: 'border-orange-200',
      bg: 'bg-orange-500',
    },
  },
  {
    label: 'Completed',
    value: 'CLOSED',
    circleClasses: {
      border: 'border-slate-300',
      bg: 'bg-slate-600',
    },
  },
];
