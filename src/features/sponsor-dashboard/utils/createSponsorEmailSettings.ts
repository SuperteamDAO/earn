import { prisma } from '@/prisma';

export async function createSponsorEmailSettings(userId: string) {
  const categories = [
    'commentSponsor',
    'deadlineSponsor',
    'productAndNewsletter',
    'replyOrTagComment',
  ];

  await prisma.emailSettings.deleteMany({
    where: {
      userId,
      category: { in: categories },
    },
  });
  await prisma.emailSettings.createMany({
    data: categories.map((category) => ({ userId, category })),
  });
}
