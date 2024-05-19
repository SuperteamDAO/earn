import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const submissions = await prisma.submission.findMany({
      select: { id: true, like: true },
    });

    for (const submission of submissions) {
      const likeCount = Array.isArray(submission.like)
        ? submission.like.length
        : 0;
      await prisma.submission.update({
        where: { id: submission.id },
        data: { likeCount },
      });
    }

    const powItems = await prisma.poW.findMany({
      select: { id: true, like: true },
    });

    for (const pow of powItems) {
      const likeCount = Array.isArray(pow.like) ? pow.like.length : 0;
      await prisma.poW.update({
        where: { id: pow.id },
        data: { likeCount },
      });
    }

    res.status(200).json({ message: 'Like counts synchronized successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}
