import { CreditEventType } from '@prisma/client';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import earncognitoClient from '@/lib/earncognitoClient';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';
import { addCreditDispute } from '@/features/credits/utils/allocateCredits';

const spamDisputeSchema = z.object({
  description: z.string().min(10),
  listingType: z.string().min(1),
  submissionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    const { userId } = sessionResponse.data;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, id: true },
    });

    if (!user) {
      logger.warn('Invalid token - No email found');
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const body = await request.json();
    logger.debug(`Request body: ${safeStringify(body)}`);

    const { description, submissionId, listingType } =
      spamDisputeSchema.parse(body);

    const existingDispute = await prisma.creditLedger.findFirst({
      where: {
        submissionId,
        userId,
        type: {
          in: [
            CreditEventType.SPAM_DISPUTE,
            CreditEventType.GRANT_SPAM_DISPUTE,
          ],
        },
      },
    });

    if (existingDispute) {
      logger.warn(`Duplicate dispute attempt for submission ${submissionId}`);
      return NextResponse.json(
        {
          error: 'A dispute has already been submitted for this submission',
        },
        { status: 400 },
      );
    }

    const spamEntry = await prisma.creditLedger.findFirst({
      where: {
        submissionId,
        userId,
        type: {
          in: [
            CreditEventType.SPAM_PENALTY,
            CreditEventType.GRANT_SPAM_PENALTY,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!spamEntry) {
      logger.warn(`No spam penalty found for submission ${submissionId}`);
      return NextResponse.json(
        {
          error: 'No spam penalty found for this submission',
        },
        { status: 400 },
      );
    }

    const daysSinceSpamEntry = Math.floor(
      (Date.now() - spamEntry.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceSpamEntry > 7) {
      logger.warn(`Dispute deadline passed for submission ${submissionId}`);
      return NextResponse.json(
        {
          error:
            'The deadline for disputing this spam penalty has passed (7 days)',
        },
        { status: 400 },
      );
    }

    let listingTitle;
    let listingUrl;

    if (listingType === 'GRANT') {
      const listing = await prisma.grantApplication.findUnique({
        where: { id: submissionId },
        select: { grant: { select: { title: true, slug: true } } },
      });
      listingTitle = listing?.grant?.title;
      listingUrl = `https://earn.superteam.fun/grants/${listing?.grant?.slug}`;
    } else {
      const listing = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { listing: { select: { title: true, slug: true } } },
      });
      listingTitle = listing?.listing?.title;
      listingUrl = `https://earn.superteam.fun/listing/${listing?.listing?.slug}`;
    }

    const payload = {
      listingTitle,
      listingUrl,
      description,
      userEmail: user.email,
      submissionId,
      listingType,
    };

    logger.info('Sending Spam Dispute notification', payload);

    const botResponse = await earncognitoClient.post(
      '/telegram/spam-dispute',
      payload,
      { validateStatus: () => true },
    );

    if (botResponse.status >= 400) {
      logger.error(
        'Error sending spam dispute notification:',
        safeStringify(botResponse.data),
      );
      return NextResponse.json(
        {
          error:
            botResponse.data?.error ?? 'Failed to send dispute notification',
        },
        { status: botResponse.status },
      );
    }

    const creditEventType =
      listingType === 'GRANT'
        ? CreditEventType.GRANT_SPAM_DISPUTE
        : CreditEventType.SPAM_DISPUTE;

    await addCreditDispute(user?.id, creditEventType, submissionId);

    return NextResponse.json({
      success: true,
      message: 'Spam dispute submitted successfully',
    });
  } catch (error) {
    logger.error('Error in spam dispute API:', safeStringify(error));

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
