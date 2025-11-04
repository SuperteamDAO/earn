import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { PrismaClientKnownRequestError } from '@/prisma/internal/prismaNamespace';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

interface CreateUserResponse {
  message: string;
  created: boolean;
}

export default async function createUser(
  req: NextApiRequest,
  res: NextApiResponse<CreateUserResponse | { error: string }>,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const privyDid = await getPrivyToken(req);
    const { email } = req.body as { email: string };

    if (!privyDid || !email) {
      logger.warn('Unauthorized request - Missing token or email');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, privyDid: true },
    });

    if (existingUserByEmail) {
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
