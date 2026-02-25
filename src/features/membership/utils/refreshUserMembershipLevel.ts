import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import {
  ELIGIBLE_PEOPLE_TYPES,
  isEligiblePeopleType,
} from './peopleEligibility';

export type RefreshUserMembershipLevelInput = {
  userId: string;
  email: string;
  currentPeopleId: string | null;
};

export async function refreshUserMembershipLevel({
  userId,
  email,
  currentPeopleId,
}: RefreshUserMembershipLevelInput): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    logger.debug('Skipping membership refresh: user has no email', { userId });
    return;
  }

  try {
    if (currentPeopleId) {
      const currentPerson = await prisma.people.findUnique({
        where: { id: currentPeopleId },
        select: { type: true },
      });
      if (isEligiblePeopleType(currentPerson?.type)) {
        logger.debug(
          'Skipping membership refresh: user already has eligible peopleId',
          {
            userId,
            peopleId: currentPeopleId,
          },
        );
        return;
      }
    }

    const matchedPerson = await prisma.people.findFirst({
      where: {
        email: normalizedEmail,
        type: {
          in: [...ELIGIBLE_PEOPLE_TYPES],
        },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
      },
    });

    const nextPeopleId = matchedPerson?.id ?? null;

    const result = await prisma.user.updateMany({
      where: {
        id: userId,
        email: normalizedEmail,
      },
      data: {
        peopleId: nextPeopleId,
      },
    });

    if (result.count > 0) {
      if (nextPeopleId) {
        logger.info('Membership refresh linked user to eligible stats people', {
          userId,
          email: normalizedEmail,
          peopleId: nextPeopleId,
        });
      } else {
        logger.info(
          'Membership refresh cleared user peopleId (no eligible stats people)',
          {
            userId,
            email: normalizedEmail,
          },
        );
      }
      return;
    }

    logger.debug('Membership refresh found no updatable user rows', {
      userId,
      email: normalizedEmail,
      peopleId: nextPeopleId,
    });
  } catch (error) {
    logger.warn('Membership refresh errored', {
      userId,
      error: safeStringify(error),
    });
  }
}
