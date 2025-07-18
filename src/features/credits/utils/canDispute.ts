import { dayjs } from '@/utils/dayjs';

import { type CreditEntry } from '../components/CreditLog';

const isSpamEntry = (entry: CreditEntry) => {
  return entry.type === 'SPAM_PENALTY' || entry.type === 'GRANT_SPAM_PENALTY';
};

export const canDispute = (entry: CreditEntry, allEntries: CreditEntry[]) => {
  if (!isSpamEntry(entry)) return false;

  const createdAt = dayjs(entry.createdAt);
  const now = dayjs();
  const daysSinceCreation = now.diff(createdAt, 'days');

  if (daysSinceCreation > 7) return false;

  const hasExistingDispute = allEntries.some(
    (existingEntry) =>
      existingEntry.submission?.id === entry.submission?.id &&
      (existingEntry.type === 'SPAM_DISPUTE' ||
        existingEntry.type === 'GRANT_SPAM_DISPUTE'),
  );

  return !hasExistingDispute;
};
