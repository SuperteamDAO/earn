import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { promises as fs } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

import { prisma } from '@/prisma';

dayjs.extend(relativeTime);

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.body;
  try {
    const jsonDirectory = path.join(process.cwd(), '/public/assets/data');
    const grantsString = await fs.readFile(
      `${jsonDirectory}/grants.json`,
      'utf8'
    );
    const grantsParsed = JSON.parse(grantsString as unknown as string);

    const sponsorsList = await prisma.sponsors.findMany({
      take: 200,
      select: {
        id: true,
        slug: true,
      },
    });

    grantsParsed.map(async (grant: any, i: number) => {
      console.log('Adding ', i);

      const sponsor = sponsorsList.find((s) => s.slug === grant.sponsorName);
      await prisma.grants.create({
        data: {
          title: grant.title,
          slug: grant.slug,
          description: grant.description,
          shortDescription: grant.shortDescription,
          skills: grant.skills,
          token: grant.token || undefined,
          rewardAmount: grant.rewardAmount || undefined,
          link: grant.link,
          sponsorId: sponsor ? sponsor.id : '',
          pocId: userId,
          isFeatured: grant.isFeatured,
        },
      });
      console.log('Successfully Added', i);
      return i;
    });
    res.status(200).json(grantsParsed?.length);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new grant.',
    });
  }
}
