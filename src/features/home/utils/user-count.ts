import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export async function getUserCount(): Promise<number> {
  const userCount = await prisma.user.count();

  const errorCount = 289;

  const roundedUserCount = Math.ceil((userCount - errorCount) / 10) * 10;

  logger.info('Successfully fetched user count', {
    totalUsers: roundedUserCount,
  });

  return roundedUserCount;
}
