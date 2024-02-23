import { verifySignature } from '@upstash/qstash/dist/nextjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  DeadlineExceededbyWeekTemplate,
  getUnsubEmails,
  kashEmail,
  rateLimitedPromiseAll,
  resend,
} from '@/features/emails';
import { prisma } from '@/prisma';

dayjs.extend(utc);

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const unsubscribedEmails = await getUnsubEmails();

    const sevenDaysAgo = dayjs().subtract(7, 'day').toISOString();
    const nineDaysAgo = dayjs().subtract(9, 'day').toISOString();

    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        deadline: {
          lt: sevenDaysAgo,
          gte: nineDaysAgo,
        },
        isWinnersAnnounced: false,
      },
      include: {
        poc: true,
      },
    });

    const emailPromises = bounties.map(async (bounty) => {
      const checkLogs = await prisma.emailLogs.findFirst({
        where: {
          bountyId: bounty.id,
          type: 'BOUNTY_DEADLINE_WEEK',
        },
      });

      if (checkLogs) {
        return null;
      }

      const pocEmail = bounty.poc?.email;
      const pocFirstName = bounty.poc?.firstName;

      if (!pocEmail || !pocFirstName || unsubscribedEmails.includes(pocEmail)) {
        return null;
      }

      await resend.emails.send({
        from: kashEmail,
        to: [pocEmail],
        bcc: ['pratikd.earnings@gmail.com'],
        subject: 'Winner Announcement for Your Earn Bounty Is Due!',
        react: DeadlineExceededbyWeekTemplate({
          name: pocFirstName,
          bountyName: bounty.title,
          link: `https://earn.superteam.fun/dashboard/listings/${
            bounty?.slug || ''
          }/submissions/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
        }),
      });

      await prisma.emailLogs.create({
        data: {
          type: 'BOUNTY_DEADLINE_WEEK',
          bountyId: bounty.id,
        },
      });
      return bounty.id;
    });

    await rateLimitedPromiseAll(
      emailPromises,
      9,
      (emailPromise) => emailPromise,
    );

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
