import { type CheckboxFilter } from '../types';

export const preStatusFilters: CheckboxFilter[] = [
  {
    label: 'Open Now',
    value: 'OPEN',
    checked: false,
  },
  {
    label: 'In Review',
    value: 'REVIEW',
    checked: false,
  },
  {
    label: 'Completed',
    value: 'CLOSED',
    checked: false,
  },
];

export const preSkillFilters: CheckboxFilter[] = [
  {
    label: 'Content',
    value: 'CONTENT',
    checked: false,
  },
  {
    label: 'Design',
    value: 'DESIGN',
    checked: false,
  },
  {
    label: 'Development',
    value: 'DEVELOPMENT',
    checked: false,
  },
  {
    label: 'Others',
    value: 'OTHER',
    checked: false,
  },
];
