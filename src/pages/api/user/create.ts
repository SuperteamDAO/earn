import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { generateUniqueReferralCode } from '@/utils/referralCodeGenerator';
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

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { privyDid },
      select: { id: true, email: true, referredById: true },
    });

    const cookieCodeRaw = (req.cookies['earn_ref'] || '')
      .toString()
      .trim()
      .toUpperCase();
    const normalizedCode = cookieCodeRaw || undefined;

    if (existingUser) {
      if (normalizedCode && !existingUser.referredById) {
        const inviter = await prisma.user.findUnique({
          where: { referralCode: normalizedCode },
          select: { id: true },
        });
        if (inviter && inviter.id !== existingUser.id) {
          const accepted = await prisma.user.count({
            where: { referredById: inviter.id },
          });
          if (accepted < 10) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { referredById: inviter.id },
            });
          } else {
            logger.info(
              `Referral cap reached for inviter ${inviter.id}, ignoring referralCode during signup (backfill)`,
            );
          }
        }
      }

      if (cookieCodeRaw) {
        res.setHeader(
          'Set-Cookie',
          `earn_ref=; Path=/; Max-Age=0; SameSite=Lax; ${
            process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
          }`,
        );
      }

      logger.warn(`User already exists with privyDid: ${privyDid}`);
      return res.status(200).json({
        message: `User already exists`,
        created: false,
      });
    }

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

    let referredById: string | undefined = undefined;
    if (normalizedCode) {
      const inviter = await prisma.user.findUnique({
        where: { referralCode: normalizedCode },
        select: { id: true },
      });

      if (inviter) {
        const accepted = await prisma.user.count({
          where: { referredById: inviter.id },
        });
        if (accepted < 10) {
          referredById = inviter.id;
        } else {
          logger.info(
            `Referral cap reached for inviter ${inviter.id}, ignoring referralCode during signup`,
          );
        }
      }
    }

    const user = await prisma.user.create({
      data: { privyDid, email: normalizedEmail, referredById },
      select: { id: true },
    });

    if (cookieCodeRaw) {
      res.setHeader(
        'Set-Cookie',
        `earn_ref=; Path=/; Max-Age=0; SameSite=Lax; ${
          process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
        }`,
      );
    }

    const code = await generateUniqueReferralCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code },
    });

    logger.info(`Created new user with ID: ${user.id}`);
    return res.status(201).json({
      message: `Created new user with ID: ${user.id}`,
      created: true,
    });
  } catch (error: any) {
    logger.error(
      `Error occurred while creating/checking user: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred while processing user creation.',
    });
  }
}
