import { verifySignature } from '@upstash/qstash/nextjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextApiRequest, NextApiResponse } from 'next';

import { DeadlineExceededWeekEmailTemplate } from '@/components/emails/deadlineExceededWeekTemplate';
import { prisma } from '@/prisma';
import resendMail from '@/utils/resend';

dayjs.extend(utc);

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const sevenDaysAgo = dayjs().subtract(7, 'day').toISOString();

    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        deadline: {
          lt: sevenDaysAgo,
        },
        isWinnersAnnounced: false,
      },
      include: {
        sponsor: {
          select: {
            UserSponsors: {
              select: {
                user: {
                  select: {
                    email: true,
                    firstName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await Promise.all(
      bounties.map(async (bounty) => {
        const checkLogs = await prisma.emailLogs.findFirst({
          where: {
            bountyId: bounty.id,
            type: 'BOUNTY_DEADLINE',
          },
        });

        if (checkLogs) {
          return;
        }

        const sponsorEmail = bounty.sponsor?.UserSponsors[0]?.user?.email;
        const sponsorFirstName =
          bounty.sponsor?.UserSponsors[0]?.user?.firstName;

        if (!sponsorEmail || !sponsorFirstName) {
          return;
        }

        await resendMail.emails.send({
          from: `Kash from Superteam <${process.env.SENDGRID_EMAIL}>`,
          to: [sponsorEmail],
          bcc: ['pratik.dholani1@gmail.com'],
          subject: 'Bounty Deadline Exceeded',
          react: DeadlineExceededWeekEmailTemplate({
            name: sponsorFirstName,
            bountyName: bounty.title,
          }),
        });

        await prisma.emailLogs.create({
          data: {
            type: 'BOUNTY_DEADLINE',
            bountyId: bounty.id,
          },
        });
      })
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
