import { verifySignature } from '@upstash/qstash/dist/nextjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextApiRequest, NextApiResponse } from 'next';

import { WeeklyRoundupTemplate } from '@/components/emails/weeklyRoundupTemplate';
import type { MainSkills, Skills } from '@/interface/skills';
import { prisma } from '@/prisma';
import { getUnsubEmails } from '@/utils/airtable';
import { rateLimitedPromiseAll } from '@/utils/rateLimitedPromises';
import resendMail from '@/utils/resend';

dayjs.extend(utc);

type Notifications = {
  label: MainSkills;
  timestamp: string;
}[];

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const unsubscribedEmails = await getUnsubEmails();
  try {
    const users = (
      await prisma.user.findMany({
        where: {
          isTalentFilled: true,
        },
      })
    ).filter((user) => user.notifications !== null);

    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        status: 'OPEN',
        isWinnersAnnounced: false,
        deadline: {
          gte: dayjs().add(1, 'day').toISOString(),
        },
      },
      include: {
        sponsor: true,
      },
    });

    const userBounties = users
      .map((user) => {
        const userNotifications = user.notifications as Notifications;

        const matchingBounties = bounties.filter((bounty) => {
          const bountySkills = bounty.skills as Skills;

          return (
            bountySkills &&
            userNotifications &&
            bountySkills.some((bountySkill: any) =>
              userNotifications.some(
                (userNotification: any) =>
                  userNotification.label === bountySkill.skills
              )
            )
          );
        });

        if (matchingBounties.length === 0) {
          return null;
        }

        return {
          userId: user.id,
          name: user.firstName,
          email: user.email,
          bounties: matchingBounties.map((bounty) => ({
            title: bounty.title,
            rewardAmount: bounty.rewardAmount,
            sponsor: bounty.sponsor.name,
            slug: bounty.slug,
          })),
        };
      })
      .filter(Boolean);

    await rateLimitedPromiseAll(userBounties, 9, async (user) => {
      try {
        if (unsubscribedEmails.includes(user?.email!)) {
          return;
        }
        await resendMail.emails.send({
          from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
          to: [user?.email!],
          subject: 'Your Weekly Bounty Roundup Is Here!',
          react: WeeklyRoundupTemplate({
            name: user?.name!,
            bounties: user?.bounties,
          }),
        });
      } catch (error) {
        console.error(`Failed to send email to ${user?.email}:`, error);
      }
    });

    res.status(200).json(userBounties);
  } catch (err: any) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
}

export default verifySignature(handler);

export const config = {
  api: {
    bodyParser: false,
  },
};
