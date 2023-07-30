import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { MainSkills, Skills } from '@/interface/skills';
import { prisma } from '@/prisma';

dayjs.extend(utc);

type Notifications = {
  label: MainSkills;
  timestamp: string;
}[];

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const users = (
      await prisma.user.findMany({
        where: {
          isVerified: true,
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
    });

    const userBounties = users.map((user) => {
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

      return {
        userId: user.id,
        bounties: matchingBounties.map((bounty) => bounty.title),
      };
    });

    res.status(200).json(userBounties);
  } catch (err: any) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
}
