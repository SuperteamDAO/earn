import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { createSubmission } from '@/pages/api/submission/create';
import { prisma } from '@/prisma';

import { dummySubmissionData } from '@/features/dev-tools/dummy-submissions/dummy-data';
import { dummySubmissionsSchema } from '@/features/dev-tools/dummy-submissions/schema';

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function generateSubmissionData(listing: any, user: any) {
  const { type, compensationType, eligibility, minRewardAsk, maxRewardAsk } =
    listing;

  if (type === 'project') {
    const data: any = {
      otherInfo: getRandomElement(dummySubmissionData.project.otherInfos),
    };

    if (!user.telegram) {
      data.telegram = getRandomElement(dummySubmissionData.telegramUsernames);
    }

    if (compensationType !== 'fixed') {
      if (compensationType === 'range' && minRewardAsk && maxRewardAsk) {
        const min = minRewardAsk;
        const max = maxRewardAsk;
        data.ask = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        data.ask = getRandomElement(dummySubmissionData.project.asks);
      }
    }

    if (eligibility && eligibility.length > 0) {
      const answers = getRandomElement(
        dummySubmissionData.project.eligibilityAnswers,
      );
      data.eligibilityAnswers = eligibility.map((q: any, index: number) => ({
        question: q.question || q.title || `Question ${index + 1}`,
        answer:
          answers[index]?.answer || `Sample answer for question ${index + 1}`,
        optional: q.optional || false,
      }));
    }

    return data;
  }

  const isHackathon = type === 'hackathon';
  const sourceData = isHackathon
    ? dummySubmissionData.hackathon
    : dummySubmissionData.bounty;

  return {
    link: getRandomElement(sourceData.links),
    tweet: Math.random() > 0.5 ? getRandomElement(sourceData.tweets) : '',
    otherInfo: getRandomElement(sourceData.otherInfos),
  };
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.VERCEL_ENV === 'production') {
      return NextResponse.json(
        { error: 'Not allowed in production' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationResult = dummySubmissionsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { listingId, count } = validationResult.data;

    const listing = await prisma.bounties.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        type: true,
        compensationType: true,
        eligibility: true,
        minRewardAsk: true,
        maxRewardAsk: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const users = await prisma.user.findMany({
      take: count * 2,
      select: {
        id: true,
        telegram: true,
      },
      where: {
        NOT: {
          Submission: {
            some: {
              listingId,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    const submissions = [];
    const usedUserIds = new Set();

    for (let i = 0; i < count && usedUserIds.size < users.length; i++) {
      let randomUser;
      do {
        randomUser = getRandomElement(users);
      } while (usedUserIds.has(randomUser.id));

      usedUserIds.add(randomUser.id);

      try {
        const existingSubmission = await prisma.submission.findFirst({
          where: { userId: randomUser.id, listingId },
        });

        if (existingSubmission) {
          continue;
        }

        const submissionData = generateSubmissionData(listing, randomUser);

        const submission = await createSubmission(
          randomUser.id,
          listingId,
          submissionData,
          listing,
        );

        submissions.push(submission);
      } catch (error) {
        logger.error(
          `Failed to create submission for user ${randomUser.id}:`,
          error,
        );
        continue;
      }
    }

    return NextResponse.json({
      message: `Created ${submissions.length} dummy submissions`,
      submissions: submissions.map((s) => ({
        id: s.id,
        userId: s.userId,
        listingId: s.listingId,
      })),
    });
  } catch (error) {
    logger.error('Error creating dummy submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
