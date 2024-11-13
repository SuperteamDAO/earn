import { prisma } from '@/prisma';

export async function createSponsorEmailSettings(userId: string) {
  const categories = new Set([
    'commentSponsor',
    'deadlineSponsor',
    'productAndNewsletter',
    'replyOrTagComment',
  ]);

  for (const category of categories) {
    await prisma.emailSettings.create({
      data: {
        user: { connect: { id: userId } },
        category,
      },
    });
  }
}
