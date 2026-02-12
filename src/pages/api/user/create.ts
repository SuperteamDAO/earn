import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { privy } from '@/lib/privy';
import { prisma } from '@/prisma';
import { PrismaClientKnownRequestError } from '@/prisma/internal/prismaNamespace';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

interface CreateUserResponse {
  message: string;
  created: boolean;
}

function getPrivyLinkedEmail(linkedAccounts: unknown[]): string | null {
  for (const account of linkedAccounts) {
    if (!account || typeof account !== 'object') continue;
    const candidate = account as Record<string, unknown>;

    if (
      candidate.type === 'email' &&
      typeof candidate.address === 'string' &&
      candidate.address.trim()
    ) {
      return candidate.address.trim().toLowerCase();
    }

    if (
      typeof candidate.email === 'string' &&
      candidate.email.trim().length > 0
    ) {
      return candidate.email.trim().toLowerCase();
    }
  }

  return null;
}

export default async function createUser(
  req: NextApiRequest,
  res: NextApiResponse<CreateUserResponse | { error: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const privyDid = await getPrivyToken(req);

    if (!privyDid) {
      logger.warn('Unauthorized request - Missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const privyUser = await privy.users()._get(privyDid);
    const linkedAccounts = privyUser?.linked_accounts || [];
    const normalizedEmail = getPrivyLinkedEmail(linkedAccounts);
    if (!normalizedEmail) {
      logger.warn(`No linked email found in Privy for user ${privyDid}`);
      return res.status(400).json({
        error:
          'Unable to create user without a verified email linked to this account',
      });
    }

    const existingUserByPrivyDid = await prisma.user.findUnique({
      where: { privyDid },
      select: { id: true, email: true },
    });
    if (existingUserByPrivyDid) {
      if (existingUserByPrivyDid.email !== normalizedEmail) {
        logger.warn(
          `Existing user ${existingUserByPrivyDid.id} has email mismatch for privyDid ${privyDid}`,
        );
      }

      return res.status(200).json({
        message: `User already exists with ID: ${existingUserByPrivyDid.id}`,
        created: false,
      });
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, privyDid: true },
    });

    if (existingUserByEmail) {
      if (existingUserByEmail.privyDid === privyDid) {
        return res.status(200).json({
          message: `User already exists with ID: ${existingUserByEmail.id}`,
          created: false,
        });
      }

      logger.warn(
        `User exists with email ${normalizedEmail} but different privyDid. Existing: ${existingUserByEmail.privyDid}, New: ${privyDid}`,
      );
      return res.status(409).json({
        error:
          'User with this email already exists with different authentication method',
      });
    }

    try {
      const user = await prisma.user.create({
        data: { privyDid, email: normalizedEmail },
        select: { id: true },
      });

      logger.info(`Created new user with ID: ${user.id}`);
      return res.status(201).json({
        message: `Created new user with ID: ${user.id}`,
        created: true,
      });
    } catch (createError: unknown) {
      if (
        createError instanceof PrismaClientKnownRequestError &&
        createError.code === 'P2002'
      ) {
        logger.warn(
          `User creation prevented due to existing email ${normalizedEmail}`,
        );

        return res.status(409).json({
          error:
            'User with this email already exists with different authentication method',
        });
      }

      throw createError;
    }
  } catch (error: any) {
    logger.error(
      `Error occurred while creating/checking user: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred while processing user creation.',
    });
  }
}
