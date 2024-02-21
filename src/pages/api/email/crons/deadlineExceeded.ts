import { verifySignature } from '@upstash/qstash/dist/nextjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextApiRequest, NextApiResponse } from 'next';

import { kashEmail } from '@/constants/kashEmail';
import {
  DeadlineSponsorTemplate,
  getUnsubEmails,
  rateLimitedPromiseAll,
} from '@/features/emails';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';

dayjs.extend(utc);

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const unsubscribedEmails = await getUnsubEmails();
    const currentTime = dayjs.utc();
    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        deadline: {
          lt: currentTime.toISOString(),
          gte: currentTime.subtract(1, 'day').toISOString(),
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
          type: 'BOUNTY_DEADLINE',
        },
      });

      if (checkLogs) {
        return null;
      }

      const pocUserEmail = bounty.poc?.email;
      const pocUserFirstName = bounty.poc?.firstName;

      if (
        !pocUserEmail ||
        !pocUserFirstName ||
        unsubscribedEmails.includes(pocUserEmail)
      ) {
        return null;
      }

      await resendMail.emails.send({
        from: kashEmail,
        to: [pocUserEmail],
        bcc: ['pratikd.earnings@gmail.com'],
        subject: 'Your Earn Listing Is Ready to Be Reviewed',
        react: DeadlineSponsorTemplate({
          name: pocUserFirstName,
          bountyName: bounty.title,
          link: `https://earn.superteam.fun/dashboard/listings/${
            bounty?.slug || ''
          }/submissions/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
        }),
      });

      await prisma.emailLogs.create({
        data: {
          type: 'BOUNTY_DEADLINE',
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
