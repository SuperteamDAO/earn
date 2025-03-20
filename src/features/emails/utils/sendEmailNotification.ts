import axios from 'axios';
import jwt from 'jsonwebtoken';

import logger from '@/lib/logger';

type EmailType =
  | 'addPayment'
  | 'announceWinners'
  | 'application'
  | 'commentSponsor'
  | 'commentActivity'
  | 'createListing'
  | 'createHackathon'
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
  | 'trancheApproved'
  | 'trancheRejected'
  | 'grantPaymentReceived'
  | 'STWinners'
  | 'nonSTWinners'
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

export function sendEmailNotification({
  type,
  id,
  userId, // pass userId of the person you are sending the email to
  otherInfo,
  triggeredBy,
}: EmailNotificationParams) {
  logger.info(`Attempting to send email notification`, {
    type,
    id,
    userId,
    environment: process.env.NODE_ENV,
    emailBackend: process.env.EMAIL_BACKEND,
    timestamp: new Date().toISOString(),
  });

  if (!process.env.EMAIL_SECRET) {
    logger.error('EMAIL_SECRET environment variable is not set');
    return;
  }

  if (!process.env.EMAIL_BACKEND) {
    logger.error('EMAIL_BACKEND environment variable is not set');
    return;
  }

  try {
    const token = jwt.sign(
      { triggeredBy },
      process.env.EMAIL_SECRET as string,
      {
        expiresIn: '60s',
      },
    );

    logger.debug('JWT token generated successfully', {
      tokenExpiry: '60s',
      timestamp: new Date().toISOString(),
    });

    axios
      .post(
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
          timeout: 5000,
        },
      )
      .then((response) => {
        logger.info(`Email notification sent successfully`, {
          type,
          id,
          userId,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        });
      })
      .catch((error) => {
        const errorDetails = {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
          timestamp: new Date().toISOString(),
        };

        if (error.response) {
          logger.error(`Email service responded with error`, {
            ...errorDetails,
            type,
            id,
            userId,
          });
        } else if (error.request) {
          logger.error(`No response received from email service`, {
            ...errorDetails,
            type,
            id,
            userId,
          });
        } else {
          logger.error(`Error setting up email request`, {
            ...errorDetails,
            type,
            id,
            userId,
          });
        }

        if (error.code === 'ECONNREFUSED') {
          logger.error(
            `Could not connect to email service at ${process.env.EMAIL_BACKEND}`,
          );
        }

        if (error.code === 'ETIMEDOUT') {
          logger.error(`Request to email service timed out after 5000ms`);
        }
      });
  } catch (error: any) {
    logger.error(`Failed to generate JWT or initialize request`, {
      error: error.message,
      type,
      id,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}
