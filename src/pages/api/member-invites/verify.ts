// pages/api/member-invites/verify.ts
import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    const invite = await prisma.userInvites.findUnique({
      where: { token },
      include: {
        sender: true,
        sponsor: true,
      },
    });

    if (!invite || invite.expires! < new Date()) {
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    res.status(200).json({
      sponsorName: invite.sponsor.name,
      senderName: `${invite.sender.firstName} ${invite.sender.lastName}`,
      memberType: invite.memberType,
      sponsorLogo: invite.sponsor.logo,
    });
  } catch (error) {
    console.error('Error verifying invite:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while verifying the invitation' });
  }
}
