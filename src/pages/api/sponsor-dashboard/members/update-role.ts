import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type Role } from '@/prisma/enums';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

const VALID_ROLES: ReadonlyArray<Role> = ['ADMIN', 'MEMBER'];

async function updateMemberRole(
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) {
  const { id, role } = req.body as {
    id?: string;
    role?: Role;
  };
  const userId = req.userId;
  const sponsorId = req.userSponsorId;

  if (!sponsorId || !userId) {
    logger.warn('Invalid token: sponsor or user context is missing');
    return res.status(400).json({ error: 'Invalid token' });
  }

  if (!id || !role || !VALID_ROLES.includes(role)) {
    logger.warn(`Invalid role update request: ${safeStringify(req.body)}`);
    return res.status(400).json({ error: 'Invalid role update request' });
  }

  if (id === userId) {
    logger.warn(`User ${userId} attempted to change their own sponsor role`);
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  try {
    const requesterMembership = await prisma.userSponsors.findUnique({
      where: {
        userId_sponsorId: {
          userId,
          sponsorId,
        },
      },
      select: { role: true },
    });

    if (
      req.role !== 'GOD' &&
      (!requesterMembership || requesterMembership.role !== 'ADMIN')
    ) {
      logger.warn(`Forbidden role update request by user with ID: ${userId}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    const memberSponsor = await prisma.userSponsors.findUnique({
      where: {
        userId_sponsorId: {
          userId: id,
          sponsorId,
        },
      },
      select: { role: true },
    });

    if (!memberSponsor) {
      logger.warn(`Member not found with ID: ${id}`);
      return res.status(404).json({ error: 'Member not found' });
    }

    if (memberSponsor.role === role) {
      logger.info(`Member ${id} already has sponsor role ${role}`);
      return res.status(200).json({ message: 'Role already up to date.' });
    }

    await prisma.userSponsors.update({
      where: {
        userId_sponsorId: {
          userId: id,
          sponsorId,
        },
      },
      data: {
        role,
      },
    });

    logger.info(`Successfully updated member ${id} to sponsor role ${role}`);
    return res.status(200).json({ message: 'Role updated successfully.' });
  } catch (error: any) {
    logger.error(`Error updating member role: ${safeStringify(error)}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSponsorAuth(updateMemberRole);
