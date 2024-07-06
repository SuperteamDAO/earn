import axios from 'axios';
import jwt from 'jsonwebtoken';

import logger from '@/lib/logger';

type EmailType =
  | 'addPayment'
  | 'announceWinners'
  | 'commentSponsor'
  | 'commentSubmission'
  | 'createListing'
  | 'deadlineExtended'
  | 'submissionLike'
  | 'submissionSponsor'
  | 'submissionTalent'
  | 'superteamWinners'
  | 'commentReply'
  | 'commentTag'
  | 'scoutInvite';

interface EmailNotificationParams {
  type: EmailType;
  id: string;
  userId?: string;
  otherInfo?: any;
  triggeredBy: any;
}

export async function sendEmailNotification({
  type,
  id,
  userId, // pass userId of the person you are sending the email to
  otherInfo,
  triggeredBy,
}: EmailNotificationParams) {
  const token = jwt.sign({ triggeredBy }, process.env.EMAIL_SECRET as string, {
    expiresIn: '60s',
  });

  try {
    await axios.post(
      process.env.EMAIL_BACKEND!,
      {
        type,
        id,
        userId,
        otherInfo,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {
    logger.error(`failed to send email for ${type} with ID ${id}: ${error}`);
    throw error;
  }
}
