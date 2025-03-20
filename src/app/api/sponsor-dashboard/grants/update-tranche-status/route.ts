import { waitUntil } from '@vercel/functions';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { getSponsorSession } from '@/features/auth/utils/getSponsorSession';
import { sendEmailNotification } from '@/features/emails/utils/sendEmailNotification';
import { addPaymentInfoToAirtable } from '@/features/grants/utils/addPaymentInfoToAirtable';

const UpdateGrantTrancheSchema = z.object({
  id: z.string(),
  approvedAmount: z.union([z.number().int().min(0), z.null()]).optional(),
  status: z.enum(['Approved', 'Rejected']),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validationResult = UpdateGrantTrancheSchema.safeParse(body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    logger.warn('Invalid request body:', errorMessage);
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: errorMessage,
      },
      { status: 400 },
    );
  }

  const session = await getSponsorSession(await headers());

  if (session.error || !session.data) {
    return NextResponse.json(
      { error: session.error },
      { status: session.status },
    );
  }
  const { id, status, approvedAmount } = validationResult.data;
  const userId = session.data.userId;
  try {
    const currentTranche = await prisma.grantTranche.findUniqueOrThrow({
      where: { id },
    });

    const { error } = await checkGrantSponsorAuth(
      session.data.userSponsorId,
      currentTranche.grantId,
    );
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const updateData: any = {
      status,
      decidedAt: new Date().toISOString(),
      approvedAmount,
    };

    const application = await prisma.grantApplication.findUniqueOrThrow({
      where: { id: currentTranche.applicationId },
      select: {
        totalTranches: true,
        approvedAmount: true,
        totalPaid: true,
      },
    });

    let totalTranches = application.totalTranches;

    if (status === 'Approved') {
      const approvedTranches = await prisma.grantTranche.findMany({
        where: {
          applicationId: currentTranche.applicationId,
          status: 'Approved',
          id: { not: id },
        },
        select: {
          approvedAmount: true,
        },
      });

      const totalApprovedSoFar = approvedTranches.reduce(
        (sum, tranche) => sum + (tranche.approvedAmount || 0),
        0,
      );

      if (totalApprovedSoFar + approvedAmount! > application.approvedAmount) {
        return NextResponse.json(
          {
            error: 'Invalid approved amount',
            message: `Total approved tranches (${totalApprovedSoFar + approvedAmount!}) would exceed grant's approved amount (${application.approvedAmount})`,
          },
          { status: 400 },
        );
      }

      const existingTranches = await prisma.grantTranche.count({
        where: {
          applicationId: currentTranche.applicationId,
          status: {
            not: 'Rejected',
          },
        },
      });
      if (
        totalTranches - existingTranches === 0 &&
        application.totalPaid + approvedAmount! < application.approvedAmount
      ) {
        totalTranches! += 1;
      }
      await prisma.grantApplication.update({
        where: { id: currentTranche.applicationId },
        include: {
          grant: true,
          user: true,
        },
        data: { totalTranches },
      });
    }

    const result = await prisma.grantTranche.update({
      where: { id },
      data: updateData,
      include: {
        GrantApplication: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                twitter: true,
                discord: true,
                kycName: true,
                location: true,
              },
            },
            grant: {
              select: {
                airtableId: true,
                isNative: true,
                title: true,
              },
            },
          },
        },
      },
    });

    waitUntil(
      (async () => {
        if (result.status === 'Approved') {
          try {
            await addPaymentInfoToAirtable(result.GrantApplication, result);
          } catch (airtableError: any) {
            console.error(
              `Error adding payment info to Airtable: ${airtableError.message}`,
            );
            console.error(
              `Airtable error details: ${safeStringify(airtableError.response?.data || airtableError)}`,
            );
          }
          try {
            sendEmailNotification({
              type: 'trancheApproved',
              id: result.id,
              userId: result.GrantApplication.userId,
              triggeredBy: userId,
            });
          } catch (emailError: any) {
            logger.error(
              `Failed to send tranche approved email notification for tranche ID: ${result.id}`,
              {
                error: emailError.message,
                stack: emailError.stack,
                trancheId: result.id,
                userId,
                recipientEmail: result.GrantApplication.user.email,
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString(),
              },
            );
          }
        }

        if (result.status === 'Rejected') {
          try {
            sendEmailNotification({
              type: 'trancheRejected',
              id: result.id,
              userId: result.GrantApplication.userId,
              triggeredBy: userId,
            });
          } catch (emailError: any) {
            logger.error(
              `Failed to send tranche rejected email notification for tranche ID: ${result.id}`,
              {
                error: emailError.message,
                stack: emailError.stack,
                trancheId: result.id,
                userId,
                recipientEmail: result.GrantApplication.user.email,
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString(),
              },
            );
          }
        }
      })(),
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error(
      `Error occurred while updating grant tranche ID: ${id}:  ${error.message}`,
    );
    return NextResponse.json(
      {
        error: error.message,
        message: 'Error occurred while updating the grant tranche.',
      },
      { status: 500 },
    );
  }
}
