import axios from 'axios';
import jwt from 'jsonwebtoken';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

type EmailType =
  | 'addPayment'
  | 'announceWinners'
  | 'application'
  | 'commentSponsor'
  | 'commentActivity'
  | 'createListing'
  | 'deadlineExtended'
  | 'submissionRejected'
  | 'submissionLike'
  | 'applicationLike'
  | 'powLike'
  | 'submissionSponsor'
  | 'submissionTalent'
  | 'grantApproved'
  | 'grantCompleted'
  | 'grantRejected'
  | 'grantPaymentReceived'
  | 'STWinners'
  | 'nonSTWinners'
  | 'commentReply'
  | 'commentTag'
  | 'scoutInvite';

interface EmailNotificationParams {
  type: EmailType;
  entityId: string;
  userId?: string;
  otherInfo?: any;
  triggeredBy: any;
}

export async function sendEmailNotification({
  type,
  entityId,
  userId, // pass userId of the person you are sending the email to
  otherInfo,
  triggeredBy,
}: EmailNotificationParams) {
  const log = await prisma.resendLogs.create({
    data: {
      type,
      status: 'initiated',
    },
  });

  const token = jwt.sign({ triggeredBy }, process.env.EMAIL_SECRET as string, {
    expiresIn: '60s',
  });

  axios
    .post(
      process.env.EMAIL_BACKEND!,
      {
        type,
        entityId,
        userId,
        otherInfo,
        logId: log.id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    .catch((error) => {
      logger.error(
        `failed to send email for ${type} to ${userId} with entity ID ${entityId}: ${error}`,
      );
    });
}
