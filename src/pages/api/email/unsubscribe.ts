import { createHmac } from 'crypto';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, signature } = req.query;

  if (!email || !signature) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const expectedSignature = createHmac('sha256', process.env.UNSUB_SECRET!)
    .update(email as string)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  try {
    await prisma.unsubscribedEmail.create({
      data: { email: email as string },
    });

    return res.status(200).json({ message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
