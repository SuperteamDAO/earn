import { type NextApiRequest, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res
      .status(400)
      .json({ message: 'Token is required and must be a string' });
  }

  if (req.method === 'POST') {
    try {
      const tokenRecord = await prisma.unsubscribeToken.findUnique({
        where: { token },
      });

      if (!tokenRecord) {
        return res.status(404).json({ message: 'Invalid token' });
      }

      const user = await prisma.user.findUnique({
        where: {
          email: tokenRecord.email,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await prisma.unsubscribedEmail.create({
        data: {
          email: tokenRecord.email,
          id: user.id,
        },
      });

      return res.status(200).send('');
    } catch (error) {
      logger.error(error);
      return res.status(500).send('');
    }
  } else if (req.method === 'GET') {
    try {
      const tokenRecord = await prisma.unsubscribeToken.findUnique({
        where: { token },
      });

      if (!tokenRecord) {
        return res.status(404).json({ message: 'Invalid token' });
      }

      const user = await prisma.user.findUnique({
        where: {
          email: tokenRecord.email,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await prisma.unsubscribedEmail.create({
        data: {
          email: tokenRecord.email,
          id: user.id,
        },
      });

      return res.status(200).send('<h1>You have been unsubscribed</h1>');
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
