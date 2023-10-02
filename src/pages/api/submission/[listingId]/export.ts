import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import { csvUpload, str2ab } from '@/utils/cloudinary';

const { Parser } = require('@json2csv/plainjs');

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      },
    });
    const result = await prisma.submission.findMany({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
      },
      include: {
        user: true,
      },
      take: 1000,
    });
    const finalJson = result?.map((item) => {
      const eligibility: any = {};
      const eligibilityAnswers: any = item?.eligibilityAnswers || [];
      eligibilityAnswers.forEach((e: any) => {
        eligibility[e.question] = e.answer;
      });
      const skills: any = item?.user?.skills || [];
      return {
        'Submission ID': item.id,
        'User First Name': item.user.firstName,
        'User Last Name': item.user.lastName,
        'User Email': item.user.email,
        'User Wallet': item.user.publicKey,
        'User Twitter': item.user.twitter || '',
        'User Discord': item.user.discord || '',
        'User Github': item.user.github || '',
        'User Linkedin': item.user.linkedin || '',
        'User Website': item.user.website || '',
        'User Telegram': item.user.telegram || '',
        'User Location': item.user.location || '',
        'User Bio': item.user.bio || '',
        'User Interests': item.user.interests || '',
        'User Experience': item.user.experience || '',
        'User Crypto Experience': item.user.cryptoExperience || '',
        'User Skills':
          skills?.map((skill: any) => skill.skills)?.join(', ') || '',
        'User Current Employer': item.user.currentEmployer || '',
        'User Work Preference': item.user?.private
          ? ''
          : item.user.workPrefernce || '',
        'Submission Link': item.link || '',
        'Submission Tweet': item.tweet || '',
        ...eligibility,
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
