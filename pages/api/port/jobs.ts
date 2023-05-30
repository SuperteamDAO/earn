import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { promises as fs } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

import { prisma } from '@/prisma';

dayjs.extend(relativeTime);

export default async function jobs(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const jsonDirectory = path.join(process.cwd(), '/public/assets/data');
    const jobsString = await fs.readFile(`${jsonDirectory}/jobs.json`, 'utf8');
    const jobsParsed = JSON.parse(jobsString as unknown as string);

    const sponsorsList = await prisma.sponsors.findMany({
      take: 300,
      select: {
        id: true,
        slug: true,
      },
    });

    jobsParsed.map(async (job: any, i: number) => {
      console.log('Adding ', i);

      const sponsor = sponsorsList.find((s) => s.slug === job.sponsorSlug);
      if (sponsor?.id) {
        await prisma.jobs.create({
          data: {
            title: job.title,
            slug: (job.title ?? '')
              .trim()
              .replace(/ /g, '-')
              .replace(/\//g, '-')
              .replace(/\./g, '-')
              .toLowerCase(),
            skills: job.skills || '',
            source: 'IMPORT',
            active: true,
            private: false,
            featured: false,
            jobType: 'fulltime',
            location: job.location || undefined,
            sponsorId: sponsor?.id || '',
            link: job.link || undefined,
            sourceDetails: job.sourceDetails || undefined,
          },
        });
      } else {
        console.log('No sponsor found - ', job.sponsorSlug);
      }
      console.log('Successfully Added', i);
      return i;
    });
    res.status(200).json(jobsParsed?.length);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new job.',
    });
  }
}
