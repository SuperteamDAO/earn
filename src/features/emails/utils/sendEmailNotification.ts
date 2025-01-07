import axios from 'axios';
import jwt from 'jsonwebtoken';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type EmailType, isBatchEmailType } from './helpers';

interface EmailNotificationParams {
  type: EmailType;
  entityId: string;
  userId?: string;
  otherInfo?: any;
  triggeredBy: any;
}

interface EmailInitiationResult {
  logId?: string;
  batchId?: string;
}

async function initiateBatchEmail(
  type: EmailType,
  triggeredBy: any,
): Promise<EmailInitiationResult> {
  const batch = await prisma.emailBatch.create({
    data: {
      type,
      status: 'initiated',
      triggeredBy,
    },
  });

  return { batchId: batch.id };
}

async function createSingleEmail(
  type: EmailType,
  triggeredBy: any,
): Promise<EmailInitiationResult> {
  const log = await prisma.emails.create({
    data: {
      type,
      status: 'initiated',
      triggeredBy,
    },
  });

  return { logId: log.id };
}

export async function sendEmailNotification({
  type,
  entityId,
  userId,
  otherInfo,
  triggeredBy,
}: EmailNotificationParams) {
  try {
    const isBatchEmail = isBatchEmailType(type);
    const result = isBatchEmail
      ? await initiateBatchEmail(type, triggeredBy)
      : await createSingleEmail(type, triggeredBy);

    const token = jwt.sign(
      { triggeredBy },
      process.env.EMAIL_SECRET as string,
      {
        expiresIn: '60s',
      },
    );

    await axios.post(
      process.env.EMAIL_BACKEND!,
      {
        type,
        entityId,
        userId,
        otherInfo,
        ...(result.batchId
          ? { batchId: result.batchId }
          : { logId: result.logId }),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {
    logger.error(
      `Failed to send ${type} email ${userId ? `to ${userId}` : '(batch)'} with entity ID ${entityId}: ${error}`,
    );
    throw error;
  }
}
