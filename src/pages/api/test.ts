import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const users = await prisma.user.findMany({
    where: {
      isTalentFilled: true,
      emailSettings: {
        some: {
          category: 'productAndNewsletter',
        },
      },
    },
    take: 20,
    select: {
      email: true,
    },
  });

  res.status(200).json(users);
}
