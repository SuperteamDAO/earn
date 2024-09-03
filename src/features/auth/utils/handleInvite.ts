import { createSponsorEmailSettings } from '@/features/sponsor-dashboard';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

interface InviteAcceptanceResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

export async function handleInviteAcceptance(
  userId: string,
  inviteToken?: string,
): Promise<InviteAcceptanceResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      logger.warn(`User not found for ID: ${userId}`);
      return { success: false, message: 'User not found' };
    }

    let invite;
    if (inviteToken) {
      invite = await prisma.userInvites.findUnique({
        where: { token: inviteToken },
      });
    } else {
      invite = await prisma.userInvites.findFirst({
        where: { email: user.email },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!invite || (invite.expires && invite.expires < new Date())) {
      logger.info(
        'User does not have a valid invite, redirecting to onboarding',
      );
      return {
        success: false,
        message: 'No valid invitation found',
        redirectUrl: '/new?onboarding=true&loginState=signedIn',
      };
    }

    const existingUserSponsor = await prisma.userSponsors.findUnique({
      where: {
        userId_sponsorId: {
          userId: userId,
          sponsorId: invite.sponsorId,
        },
      },
    });

    if (existingUserSponsor) {
      logger.info(
        `User ${userId} is already a member of sponsor ${invite.sponsorId}`,
      );
      return {
        success: false,
        message: 'You are already a member of this sponsor',
      };
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.userSponsors.create({
        data: {
          userId: userId,
          sponsorId: invite.sponsorId,
          role: invite.memberType,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { currentSponsorId: invite.sponsorId },
      });

      await prisma.userInvites.delete({
        where: { id: invite.id },
      });
    });

    await createSponsorEmailSettings(userId);

    logger.info(`Invitation accepted successfully for user ${userId}`);
    return {
      success: true,
      message: 'Invitation accepted successfully',
      redirectUrl: '/dashboard/listings/?loginState=signedIn',
    };
  } catch (error) {
    logger.error(`Error accepting invite: ${safeStringify(error)}`);
    return {
      success: false,
      message: 'An error occurred while accepting the invitation',
    };
  }
}
