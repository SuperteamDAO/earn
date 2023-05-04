import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { promises as fs } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

import { prisma } from '@/prisma';

dayjs.extend(relativeTime);

interface Rewards {
  first?: string;
  second?: string;
  third?: string;
  forth?: string;
  fifth?: string;
}

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.body;
  try {
    const jsonDirectory = path.join(process.cwd(), '/public/assets/data');
    const bountiesString = await fs.readFile(
      `${jsonDirectory}/bounties.json`,
      'utf8'
    );
    const bountiesParsed = JSON.parse(bountiesString as unknown as string);

    const sponsorsList = await prisma.sponsors.findMany({
      take: 300,
      select: {
        id: true,
        slug: true,
      },
    });

    const superteamSponsor = sponsorsList.find((s) => s.slug === 'superteam');

    bountiesParsed.map(async (bounty: any, i: number) => {
      console.log('Adding ', i);
      const bountyDeadline = (bounty.deadline || '').split('/');
      const deadlineDate = bounty.deadline
        ? dayjs(
            new Date(
              `${bountyDeadline[2]}-${bountyDeadline[1]}-${bountyDeadline[0]} 18:00:00`
            )
          ).toISOString()
        : undefined;
      const rewards: Rewards = {};
      if (bounty['prize-1']) {
        rewards.first = bounty['prize-1'];
      } else {
        rewards.first = bounty.rewardAmount || 0;
      }
      if (bounty['prize-2']) {
        rewards.second = bounty['prize-2'];
      }
      if (bounty['prize-3']) {
        rewards.third = bounty['prize-3'];
      }
      if (bounty['prize-4']) {
        rewards.forth = bounty['prize-4'];
      }
      if (bounty['prize-5']) {
        rewards.fifth = bounty['prize-5'];
      }

      const sponsor = sponsorsList.find((s) => s.slug === bounty.sponsorName);
      await prisma.bounties.create({
        data: {
          title: bounty.title,
          slug: bounty.slug,
          description: bounty.description,
          skills: bounty.skills,
          deadline: deadlineDate,
          isPublished: !bounty.private,
          token: bounty.token,
          rewardAmount: bounty.rewardAmount,
          rewards: JSON.parse(JSON.stringify(rewards)),
          sponsorId: sponsor ? sponsor.id : superteamSponsor?.id || '',
          pocId: userId,
          status: bounty.status,
          isFeatured: false,
          isActive: true,
          isArchived: false,
        },
      });
      console.log('Successfully Added', i);
      return i;
    });
    res.status(200).json(bountiesParsed?.length);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}
