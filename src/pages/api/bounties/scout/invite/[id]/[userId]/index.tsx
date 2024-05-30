import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

async function scoutInvite(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  const userId = params.userId as string;

  if (req.method !== 'POST') res.status(405).send('Method Not Allowed');

  try {
    const scoutBounty = await prisma.bounties.findFirst({
      where: {
        id,
      },
    });

    if (scoutBounty === null) return res.status(404).send('Bounty Not Found');

    const sponsorUserId = req.userId;
    const user = await prisma.user.findUnique({
      where: {
        id: sponsorUserId,
      },
    });
    if (scoutBounty?.sponsorId !== user?.currentSponsorId)
      return res
        .status(403)
        .send(`Bounty doesn't belong to requesting sponsor`);

    const scout = await prisma.scouts.findFirst({
      where: {
        listingId: id,
        userId: userId,
      },
    });
    if (!scout) return res.status(404).send('Scout Not Found');

    await sendEmailNotification({
      type: 'scoutInvite',
      id: id,
      userId,
    });
    const updateScout = await prisma.scouts.update({
      where: {
        id: scout.id,
      },
      data: {
        invited: true,
      },
    });
    return res.status(200).send(updateScout);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error,
      message: `Error occurred while inviting scout user=${userId} for bounty with id=${id}.`,
    });
  }
}

export default withAuth(scoutInvite);
