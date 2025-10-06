import { type BountyType } from '@/prisma/enums';

export const labelMenuOptions = (type: BountyType | 'grant' | undefined) => [
  { label: 'Unreviewed', value: 'Unreviewed' },
  ...(type !== 'project' ? [{ label: 'Reviewed', value: 'Reviewed' }] : []),
  { label: 'Shortlisted', value: 'Shortlisted' },
  ...(type === 'project' || type === 'bounty'
    ? [
        { label: 'Mid Quality', value: 'Mid_Quality' },
        { label: 'Low Quality', value: 'Low_Quality' },
      ]
    : []),
  { label: 'Spam', value: 'Spam', hidden: true },
  ...(type === 'bounty'
    ? [
        {
          label: 'Inaccessible',
          value: 'Inaccessible',
          hidden: true,
          aiOnly: true,
        },
        {
          label: 'Needs Review',
          value: 'Needs_Review',
          hidden: true,
          aiOnly: true,
        },
      ]
    : []),
];

export const labelMenuOptionsGrants = [
  { label: 'Pending', value: 'Pending' },
  {
    label: 'Low Quality',
    value: 'Low_Quality',
  },
  {
    label: 'Mid Quality',
    value: 'Mid_Quality',
  },
  {
    label: 'High Quality',
    value: 'High_Quality',
  },
];
