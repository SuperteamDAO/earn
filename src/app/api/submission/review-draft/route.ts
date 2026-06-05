import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { submissionReviewRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

import { getSubmissionReviewPrompt } from './prompt';

const requestSchema = z.object({
  listingId: z.string(),
  link: z.string().optional(),
  tweet: z.string().optional(),
  otherInfo: z.string().optional(),
  ask: z.number().optional().nullable(),
  eligibilityAnswers: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .optional(),
});

const reviewResultSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall score from 0 to 100'),
  signal: z
    .enum(['green', 'yellow', 'red'])
    .describe(
      'green if score >= 75, yellow if 45-74, red if below 45',
    ),
  summary: z
    .string()
    .describe('One sentence overall verdict on the submission'),
  suggestions: z
    .array(z.string())
    .max(3)
    .describe('2-3 specific, actionable improvements the submitter should make'),
  fields: z
    .object({
      link: z
        .string()
        .nullable()
        .describe('Feedback on the submission link, or null if no issue'),
      otherInfo: z
        .string()
        .nullable()
        .describe('Feedback on the additional info field, or null if no issue'),
      eligibility: z
        .array(
          z.object({
            index: z.number().describe('0-based index of the question'),
            feedback: z.string().describe('Specific feedback on this answer'),
          }),
        )
        .describe('Per-question feedback, empty array if no issues'),
    })
    .describe('Per-field feedback'),
});

export type SubmissionReviewResult = z.infer<typeof reviewResultSchema>;

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession(await headers());

    if (session.error || !session.data) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const userId = session.data.userId;

    const rateLimitResponse = await checkAndApplyRateLimitApp({
      limiter: submissionReviewRateLimiter,
      identifier: userId,
      routeName: 'submissionReviewDraft',
    });

    if (rateLimitResponse) return rateLimitResponse;

    const body = requestSchema.parse(await req.json());
    const { listingId, link, tweet, otherInfo, ask, eligibilityAnswers } = body;

    logger.debug(`Submission review request: ${safeStringify(body)}`);

    const listing = await prisma.bounties.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        type: true,
        description: true,
        requirements: true,
        skills: true,
        eligibility: true,
        compensationType: true,
        minRewardAsk: true,
        maxRewardAsk: true,
        rewardAmount: true,
        token: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const SUPPORTED_TYPES = ['bounty', 'project', 'hackathon'];
    if (!SUPPORTED_TYPES.includes(listing.type)) {
      return NextResponse.json(
        { error: 'AI review is not available for this listing type' },
        { status: 400 },
      );
    }

    const skills = (listing.skills as { skills: string[] }[] | null)
      ?.flatMap((s) => s.skills)
      .filter(Boolean) ?? [];

    const eligibilityQuestions = (
      listing.eligibility as {
        question: string;
        optional?: boolean;
      }[] | null
    ) ?? [];

    const prompt = getSubmissionReviewPrompt({
      listingTitle: listing.title,
      listingType: listing.type,
      description: listing.description ?? '',
      requirements: listing.requirements ?? null,
      skills,
      eligibilityQuestions,
      compensationType: listing.compensationType ?? 'fixed',
      minRewardAsk: listing.minRewardAsk,
      maxRewardAsk: listing.maxRewardAsk,
      rewardAmount: listing.rewardAmount,
      token: listing.token ?? 'USDC',
      submission: {
        link,
        tweet,
        otherInfo,
        ask,
        eligibilityAnswers,
      },
    });

    const { object } = await generateObject({
      model: openrouter('openai/gpt-4o-mini'),
      schema: reviewResultSchema as any,
      prompt,
      maxTokens: 1000,
    });

    return NextResponse.json(object, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.flatten() },
        { status: 400 },
      );
    }

    logger.error('Error reviewing submission draft:', safeStringify(error));
    console.error('[review-draft] Full error:', error);
    return NextResponse.json(
      { error: 'Failed to review submission' },
      { status: 500 },
    );
  }
}
