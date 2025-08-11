import { type BountyType } from '@prisma/client';

export const labelMenuOptions = (type: BountyType | 'grant' | undefined) => [
  { label: 'Unreviewed', value: 'Unreviewed' },
  ...(type !== 'project' ? [{ label: 'Reviewed', value: 'Reviewed' }] : []),
  { label: 'Shortlisted', value: 'Shortlisted' },
  ...(type !== 'project' ? [{ label: 'Spam', value: 'Spam' }] : []),
  ...(type === 'project' || type === 'bounty'
    ? [
        { label: 'Mid Quality', value: 'Mid_Quality' },
        { label: 'Low Quality', value: 'Low_Quality' },
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
