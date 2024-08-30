import { type NextApiRequest, type NextApiResponse } from 'next';

import {
  extractDiscordUsername,
  extractGitHubUsername,
  extractLinkedInUsername,
  extractTelegramUsername,
  extractTwitterUsername,
  isValidWebsiteUrl,
} from '@/features/talent';
import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const users = await prisma.user.findMany();
    let updatedCount = 0;

    for (const user of users) {
      const updatedFields: any = {};

      if (user.discord) {
        const cleanedDiscord = extractDiscordUsername(user.discord);
        if (cleanedDiscord !== user.discord) {
          updatedFields.discord = cleanedDiscord;
        }
      }

      if (user.twitter) {
        const cleanedTwitter = `https://x.com/${extractTwitterUsername(user.twitter)}`;
        if (cleanedTwitter !== user.twitter) {
          updatedFields.twitter = cleanedTwitter;
        }
      }

      if (user.telegram) {
        const cleanedTelegram = `https://t.me/${extractTelegramUsername(user.telegram)}`;
        if (cleanedTelegram !== user.telegram) {
          updatedFields.telegram = cleanedTelegram;
        }
      }

      if (user.linkedin) {
        const cleanedLinkedIn = `https://linkedin.com/in/${extractLinkedInUsername(user.linkedin)}`;
        if (cleanedLinkedIn !== user.linkedin) {
          updatedFields.linkedin = cleanedLinkedIn;
        }
      }

      if (user.github) {
        const cleanedGitHub = `https://github.com/${extractGitHubUsername(user.github)}`;
        if (cleanedGitHub !== user.github) {
          updatedFields.github = cleanedGitHub;
        }
      }

      if (user.website) {
        const isValidWebsite = isValidWebsiteUrl(user.website);
        if (!isValidWebsite && user.website !== null) {
          updatedFields.website = null;
        }
      }

      if (Object.keys(updatedFields).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updatedFields,
        });
        updatedCount++;
      }
    }

    res.status(200).json({ message: `Updated ${updatedCount} user profiles` });
  } catch (error) {
    console.error('Error cleaning social profiles:', error);
    res.status(500).json({ message: 'Error cleaning social profiles' });
  }
}
