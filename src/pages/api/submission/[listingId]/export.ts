import { Parser } from '@json2csv/plainjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';
import { csvUpload, str2ab } from '@/utils/cloudinary';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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

  const params = req.query;

  const listingId = params.listingId as string;
  try {
    const bounty = await prisma.bounties.findFirst({
      where: {
        id: listingId,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        slug: true,
        type: true,
        sponsorId: true,
      },
    });

    if (user?.currentSponsorId !== bounty?.sponsorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.submission.findMany({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 1000,
    });
    const finalJson = result?.map((item, i) => {
      const user = item.user;
      const eligibility: any = {};
      const eligibilityAnswers: any = item?.eligibilityAnswers || [];
      eligibilityAnswers.forEach((e: any) => {
        eligibility[e.question] = e.answer;
      });
      return {
        'Sr no': i + 1,
        'User Link': `https://earn.superteam.fun/t/${user.username}`,
        'User Name': `${user.firstName} ${user.lastName}`,
        'Submission Link': item.link || '',
        ...eligibility,
        Ask: item.ask && item.ask,
        'Tweet Link': item.tweet || '',
        'Email ID': user.email,
        'User Twitter': user.twitter || '',
        'User Wallet': user.publicKey,
        Label: item.label,
        'Winner Position': item.isWinner ? item.winnerPosition : '',
      };
    });
    const parser = new Parser({});
    const csv = parser.parse(finalJson);
    const fileName = `${bounty?.slug || listingId}-submissions-${Date.now()}`;
    const file = str2ab(csv, fileName);
    const cloudinaryDetails = await csvUpload(file, fileName, listingId);
    res.status(200).json({
      url: cloudinaryDetails?.secure_url || cloudinaryDetails?.url,
    });
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while exporting submissions of listing=${listingId}.`,
    });
  }
}
