import type { NextApiResponse } from 'next';
import slugify from 'slugify';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

const checkSlug = async (slug: string): Promise<boolean> => {
  try {
    const bounty = await prisma.bounties.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });

    if (bounty) {
      return true;
    }
    return false;
  } catch (error) {
    logger.error(
      `Error occurred while fetching bounty with slug=${slug}.`,
      error,
    );
    return false;
  }
};

const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = slugify(title, { lower: true, strict: true });
  let slugExists = await checkSlug(slug);
  let i = 1;

  while (slugExists) {
    const newTitle = `${title}-${i}`;
    slug = slugify(newTitle, { lower: true, strict: true });
    slugExists = await checkSlug(slug);
    i += 1;
  }

  return slug;
};

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  // eslint-disable-next-line unused-imports/no-unused-vars
  const { title, eligibility, hackathonSponsor, ...data } = req.body;

  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  if (!user.hackathonId) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: user.hackathonId },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found.' });
    }

    const slug = await generateUniqueSlug(title);

    const finalData = {
      sponsorId: hackathonSponsor,
      title,
      slug,
      hackathonId: hackathon.id,
      deadline: hackathon.deadline,
      eligibility: hackathon.eligibility,
      ...data,
    };
    const result = await prisma.bounties.create({
      data: finalData,
      include: {
        sponsor: true,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}

export default withAuth(handler);
