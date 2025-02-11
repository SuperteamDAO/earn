import { prisma } from '@/prisma';

async function main() {
  try {
    const duplicateSubmissions = await prisma.submission.groupBy({
      by: ['userId', 'link'],
      where: {
        link: {
          not: null,
          notIn: ['', ' '],
          contains: 'x.com',
        },
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 3)), // last 3 months
        },
      },
      _count: {
        link: true,
      },
      _min: {
        createdAt: true,
      },
      _max: {
        createdAt: true,
      },
      having: {
        link: {
          _count: {
            gt: 2,
          },
        },
      },
      orderBy: {
        _max: {
          createdAt: 'desc',
        },
      },
    });

    const formattedResponse = duplicateSubmissions.map((item) => ({
      userId: item.userId,
      submissionCount: item._count.link,
      link: item.link,
      firstSubmissionDate: item._min.createdAt,
      lastSubmissionDate: item._max.createdAt,
    }));

    console.log(formattedResponse.length);
    console.log(formattedResponse);
  } catch (error) {
    console.error('Error fetching duplicate submissions:', error);
  }
}
await main();
