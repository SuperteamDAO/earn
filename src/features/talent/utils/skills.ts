import { type Skills } from '@/interface/skills';

export const devSkills = ['Frontend', 'Backend', 'Blockchain', 'Mobile'];
export const hasDevSkills = (skills: Skills) =>
  skills?.some((skill) => devSkills.includes(skill.skills));
