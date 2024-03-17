import { type NextApiRequest, type NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { body, method } = req;

  if (method !== 'POST') {
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user?.currentSponsorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rpcUrl = process.env.RPC_URL!;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying Solana request:', error);
    return res.status(500).json({ error: 'Failed to proxy request' });
  }
}
