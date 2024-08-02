import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res
      .status(400)
      .json({ message: 'Email is required and must be a string' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const unsubscribedEmail = await prisma.unsubscribedEmail.create({
      data: {
        email: email,
        id: user.id,
      },
    });

    return res.status(200).json(unsubscribedEmail);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
