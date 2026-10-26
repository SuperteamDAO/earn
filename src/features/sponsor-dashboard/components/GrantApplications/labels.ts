import { SubmissionLabels } from '@/prisma/enums';

import { labelMenuOptionsGrants } from '../../constants';

const LABELS: ReadonlyArray<string> = Object.values(SubmissionLabels);

const isSubmissionLabel = (value: string): value is SubmissionLabels =>
  LABELS.includes(value);

// The dashboard's grant label options, typed as the labels they are.
export const grantLabelOptions = labelMenuOptionsGrants.flatMap((option) =>
  isSubmissionLabel(option.value)
    ? [{ label: option.label, value: option.value }]
    : [],
);
