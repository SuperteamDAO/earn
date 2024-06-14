import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function user(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  const { name, slug, logo, url, industry, twitter, bio, entityName } =
    req.body;

  try {
    if (user && (!user.currentSponsorId || user.role === 'GOD')) {
      const result = await prisma.sponsors.create({
        data: {
          name,
          slug,
          logo,
          url,
          industry,
          twitter,
          bio,
          entityName,
        },
      });
      await prisma.userSponsors.create({
        data: {
          userId: userId as string,
          sponsorId: result.id,
          role: 'ADMIN',
        },
      });
      await prisma.user.update({
        where: {
          id: userId as string,
        },
        data: {
          currentSponsorId: result.id,
        },
      });
      const categories = new Set();

      categories.add('commentSponsor');
      categories.add('deadlineSponsor');
      categories.add('productAndNewsletter');
      categories.add('replyOrTagComment');

      for (const category of categories) {
        await prisma.emailSettings.create({
          data: {
            user: { connect: { id: userId as string } },
            category: category as string,
          },
        });
      }

      return res.status(200).json(result);
    } else {
      return res.status(400).json({
        message: 'Error occurred while adding a new sponsor.',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}

export default withAuth(user);
