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

function normalizeNonEmpty(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

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
        chapterId: true,
        type: true,
        name: true,
        telegram: true,
        discord: true,
        xUsername: true,
        solWallet: true,
        skills: true,
        handle: true,
        city: true,
        proofOfWork: true,
        bestWorkUrl: true,
        source: true,
        airtableRecordId: true,
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
        chapterId: normalizeNonEmpty(matchedPerson?.chapterId),
        membershipType: normalizeNonEmpty(matchedPerson?.type),
        membershipDisplayName: normalizeNonEmpty(matchedPerson?.name),
        membershipTelegram: normalizeNonEmpty(matchedPerson?.telegram),
        membershipDiscord: normalizeNonEmpty(matchedPerson?.discord),
        membershipXUsername: normalizeNonEmpty(matchedPerson?.xUsername),
        membershipSolWallet: normalizeNonEmpty(matchedPerson?.solWallet),
        membershipSkillsText: normalizeNonEmpty(matchedPerson?.skills),
        handle: normalizeNonEmpty(matchedPerson?.handle),
        city: normalizeNonEmpty(matchedPerson?.city),
        proofOfWork: normalizeNonEmpty(matchedPerson?.proofOfWork),
        bestWorkUrl: normalizeNonEmpty(matchedPerson?.bestWorkUrl),
        source: normalizeNonEmpty(matchedPerson?.source),
        airtableRecordId: normalizeNonEmpty(matchedPerson?.airtableRecordId),
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
