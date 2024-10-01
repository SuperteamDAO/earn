import { createHmac } from 'crypto';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const email =
    req.method === 'GET'
      ? (req.query.email as string)
      : req.body.email || (req.query.email as string);
  const signature =
    req.method === 'GET'
      ? (req.query.signature as string)
      : req.body.signature || (req.query.signature as string);

  if (!email || !signature) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const expectedSignature = createHmac('sha256', process.env.UNSUB_SECRET!)
    .update(email)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(403).json({ message: 'Invalid signature' });
  }

  try {
    const existingUnsubscription = await prisma.unsubscribedEmail.findUnique({
      where: { email },
    });

    if (existingUnsubscription) {
      return res.status(200).json({ message: 'Already unsubscribed' });
    }

    await prisma.unsubscribedEmail.create({
      data: { email },
    });

    await prisma.emailSettings.deleteMany({
      where: { user: { email } },
    });

    if (req.method === 'GET') {
      return res
        .status(200)
        .send('<h1>You have been successfully unsubscribed</h1>');
    } else {
      return res.status(200).json({ message: 'Successfully unsubscribed' });
    }
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
