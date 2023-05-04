import { promises as fs } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.body;
  console.log('file: sponsors.ts:5 ~ user ~ userId:', userId);
  try {
    const jsonDirectory = path.join(process.cwd(), '/public/assets/data');
    const sponsorsString = await fs.readFile(
      `${jsonDirectory}/newSponsors.json`,
      'utf8'
    );
    const sponsorsParsed = JSON.parse(sponsorsString as unknown as string);
    console.log(
      'file: sponsors.ts:10 ~ user ~ sponsorsParsed:',
      sponsorsParsed?.length
    );

    sponsorsParsed.map(async (sponsor: any, i: number) => {
      console.log('Adding ', i);
      // eslint-disable-next-line no-await-in-loop
      // await createSponsor(sponsorsParsed[i]);
      const result = await prisma.sponsors.create({
        data: {
          name: sponsor.name,
          slug: sponsor.slug,
          logo: sponsor.logo,
          url: sponsor.url || undefined,
          industry: 'Crypto',
          twitter: sponsor.twitter || undefined,
          bio: sponsor.bio || undefined,
        },
      });
      await prisma.userSponsors.create({
        data: {
          userId,
          sponsorId: result.id,
          role: 'ADMIN',
        },
      });
      console.log('Successfully Added', i);
      // Adds onn fruits before returning
      return i;
    });
    res.status(200).json(sponsorsParsed?.length);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}
