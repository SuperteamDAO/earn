import { PrismaClient } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const users = await prisma.user.findMany();

    for (const user of users) {
      const categories = new Set();

      if (user.currentSponsorId) {
        categories.add('commentSponsor');
        categories.add('deadlineSponsor');
        categories.add('productAndNewsletter');
      }

      if (user.isTalentFilled) {
        categories.add('weeklyListingRoundup');
        categories.add('createListing');
        categories.add('commentOrLikeSubmission');
        categories.add('productAndNewsletter');
      }

      // Create EmailSettings for each category
      for (const category of categories) {
        await prisma.emailSettings.create({
          data: {
            user: { connect: { id: user.id } },
            category: category as string,
          },
        });
      }
    }

    res.status(200).json({ message: 'Email settings updated successfully.' });
  } catch (error: any) {
    console.error('Request error', error);
    res
      .status(500)
      .json({ error: 'Error updating email settings', details: error.message });
  }
}
