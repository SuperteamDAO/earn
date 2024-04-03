import { PrismaClient } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const emails = [''];

    if (
      !Array.isArray(emails) ||
      emails.some((email) => typeof email !== 'string')
    ) {
      return res.status(400).json({
        error: 'Invalid request format. Expected an array of email strings.',
      });
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        id: true,
      },
    });

    const userIds = users.map((user) => user.id);

    await prisma.emailSettings.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });

    res.status(200).json({
      message: `Email settings deleted for users with the provided emails.`,
    });
  } catch (error: any) {
    console.error('Request error', error);
    res.status(500).json({
      error: 'Error deleting email settings for provided emails',
      details: error.message,
    });
  }
}
