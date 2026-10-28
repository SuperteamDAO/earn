import { prisma } from '@/prisma';

export async function createSponsorEmailSettings(userId: string) {
  const categories = [
    'commentSponsor',
    'deadlineSponsor',
    'productAndNewsletter',
    'replyOrTagComment',
  ];

  // One transaction, so a failed insert cannot leave the categories deleted.
  await prisma.$transaction([
    prisma.emailSettings.deleteMany({
      where: {
        userId,
        category: { in: categories },
      },
    }),
    prisma.emailSettings.createMany({
      data: categories.map((category) => ({ userId, category })),
    }),
  ]);
}
