import { creditAggregate } from '@/features/credits/utils/creditAggregate';

export async function canUserSubmit(userId: string) {
  const balance = await creditAggregate(userId);
  return balance > 0;
}
