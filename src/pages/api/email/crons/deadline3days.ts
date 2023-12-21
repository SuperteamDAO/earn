import { verifySignature } from '@upstash/qstash/dist/nextjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextApiRequest, NextApiResponse } from 'next';

import { DeadlineThreeDaysTemplate } from '@/components/emails/deadline3dayTemplate';
import { prisma } from '@/prisma';
import { getUnsubEmails } from '@/utils/airtable';
import { rateLimitedPromiseAll } from '@/utils/rateLimitedPromises';
import resendMail from '@/utils/resend';

dayjs.extend(utc);

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const unsubscribedEmails = await getUnsubEmails();
    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        deadline: {
          gte: dayjs().add(1, 'day').toISOString(),
        },
      },
    });
    const bountiesWithDeadline = bounties.filter((bounty) => {
      return dayjs
        .utc(bounty.deadline?.toISOString().split('T')[0])
        .isSame(dayjs.utc().add(3, 'day').toISOString().split('T')[0]);
    });

    const emailPromises = bountiesWithDeadline.map(async (bounty) => {
      const checkLogs = await prisma.emailLogs.findFirst({
        where: {
          bountyId: bounty.id,
          type: 'BOUNTY_CLOSE_DEADLINE',
        },
      });

      if (checkLogs) {
        return;
      }

      const subscribe = await prisma.subscribeBounty.findMany({
        where: {
          bountyId: bounty.id,
        },
        include: {
          User: true,
        },
      });

      const subEmail = subscribe.map((sub) => {
        return {
          email: sub.User.email,
          name: sub.User.firstName,
        };
      });
      const emailsSent: string[] = [];
      await rateLimitedPromiseAll(subEmail, 10, async (e) => {
        if (
          emailsSent.includes(e.email) ||
          !e.email ||
          unsubscribedEmails.includes(e.email)
        ) {
          return;
        }
        await resendMail.emails.send({
          from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
          to: [e.email],
          subject: 'This Bounty Is Expiring Soon!',
          react: DeadlineThreeDaysTemplate({
            name: e.name!,
            bountyName: bounty.title,
            link: `https://earn.superteam.fun/listings/bounties/${
              bounty?.slug || ''
            }/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
          }),
        });
        emailsSent.push(e.email);

        await prisma.emailLogs.create({
          data: {
            type: 'BOUNTY_CLOSE_DEADLINE',
            bountyId: bounty.id,
          },
        });
      });
    });

    const emailResults = await Promise.all(emailPromises);

    const sentBountyIds = emailResults.filter(
      (sentBountyId) => sentBountyId !== null
    );

    if (sentBountyIds.length > 0) {
      console.log('Sent emails for bounties:', sentBountyIds);
    }

    return res.status(200).json({ message: 'Ok' });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: 'Something went wrong. Check server logs for details.' });
  }
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
