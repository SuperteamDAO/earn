import type { NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

function extractTweetId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const trimmed = url.trim();
    const urlWithProtocol = trimmed.startsWith('http')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(urlWithProtocol);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('twitter.com') && !host.includes('x.com')) {
      return null;
    }
    const segments = parsed.pathname.split('/').filter(Boolean);
    const statusIndex = segments.indexOf('status');
    if (statusIndex !== -1) {
      const id = segments[statusIndex + 1];
      if (typeof id === 'string' && /^\d+$/.test(id)) {
        return id;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const tweetStatsQuerySchema = z.object({
  submissionId: z
    .string({
      required_error: 'Missing or invalid submissionId parameter',
    })
    .trim()
    .min(1, 'Missing or invalid submissionId parameter'),
});

type TweetSource = 'link' | 'tweet';

interface TwitterPublicMetrics {
  impression_count?: number;
  like_count?: number;
  quote_count?: number;
  reply_count?: number;
  retweet_count?: number;
}

interface TweetMetrics {
  views: number;
  likes: number;
  retweets: number;
  comments: number;
  isAvailable: boolean;
}

const unavailableMetrics = (): TweetMetrics => ({
  views: 0,
  likes: 0,
  retweets: 0,
  comments: 0,
  isAvailable: false,
});

const toTweetMetrics = (
  metrics: TwitterPublicMetrics | undefined,
): TweetMetrics => {
  if (!metrics) return unavailableMetrics();

  return {
    views: metrics.impression_count || 0,
    likes: metrics.like_count || 0,
    retweets: (metrics.retweet_count || 0) + (metrics.quote_count || 0),
    comments: metrics.reply_count || 0,
    isAvailable: true,
  };
};

const buildStatsBySource = (
  tweetIds: Record<TweetSource, string | null>,
  metricsByTweetId: Map<string, TwitterPublicMetrics> = new Map(),
): Record<TweetSource, TweetMetrics | null> => ({
  link: tweetIds.link
    ? toTweetMetrics(metricsByTweetId.get(tweetIds.link))
    : null,
  tweet: tweetIds.tweet
    ? toTweetMetrics(metricsByTweetId.get(tweetIds.tweet))
    : null,
});

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported',
    });
  }

  if (!req.userSponsorId) {
    logger.warn(`Tweet stats access denied for user ${req.userId}`);
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'User does not have an active sponsor',
    });
  }

  const validation = tweetStatsQuerySchema.safeParse(req.query);

  if (!validation.success) {
    const errorMessage = validation.error.errors
      .map((err) => err.message)
      .join(', ');
    logger.warn(`Tweet stats validation failed: ${errorMessage}`);
    return res.status(400).json({
      error: errorMessage,
      message: 'Validation failed: Invalid request query parameters',
    });
  }

  const { submissionId } = validation.data;

  let submission: { link: string | null; tweet: string | null };
  try {
    const foundSubmission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
      },
      select: { link: true, tweet: true },
    });

    if (!foundSubmission) {
      logger.warn(
        `Submission ${submissionId} not found or inaccessible to user ${req.userId}`,
      );
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Submission not found',
      });
    }

    submission = foundSubmission;
  } catch (error: any) {
    logger.error(
      `Error querying submission ${submissionId}: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve submission details',
    });
  }

  const tweetIds: Record<TweetSource, string | null> = {
    link: submission.link ? extractTweetId(submission.link) : null,
    tweet: submission.tweet ? extractTweetId(submission.tweet) : null,
  };
  const uniqueTweetIds = [
    ...new Set(
      Object.values(tweetIds).filter((tweetId): tweetId is string =>
        Boolean(tweetId),
      ),
    ),
  ];

  if (uniqueTweetIds.length === 0) {
    return res.status(200).json({
      data: buildStatsBySource(tweetIds),
      message: 'No valid Twitter/X post URLs found in submission',
    });
  }

  const bearerToken =
    process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    logger.warn(
      'Twitter/X API bearer token is not configured. Returning 0 metrics.',
    );
    return res.status(200).json({
      data: buildStatsBySource(tweetIds),
      message: 'Operation successful',
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const twitterUrl = new URL('https://api.twitter.com/2/tweets');
    twitterUrl.searchParams.set('ids', uniqueTweetIds.join(','));
    twitterUrl.searchParams.set('tweet.fields', 'public_metrics');

    const response = await fetch(twitterUrl, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.error(
        `Twitter API responded with status ${response.status}: ${await response.text()}`,
      );
      return res.status(200).json({
        data: buildStatsBySource(tweetIds),
        message: 'Operation successful',
      });
    }

    const json = (await response.json()) as {
      data?: Array<{ id?: string; public_metrics?: TwitterPublicMetrics }>;
    };
    const metricsByTweetId = new Map<string, TwitterPublicMetrics>();

    for (const tweet of json.data || []) {
      if (tweet.id && tweet.public_metrics) {
        metricsByTweetId.set(tweet.id, tweet.public_metrics);
      }
    }

    if (metricsByTweetId.size === 0) {
      logger.warn(
        `Metrics not found in Twitter API response for tweetIds: ${uniqueTweetIds.join(',')}`,
      );
    }

    return res.status(200).json({
      data: buildStatsBySource(tweetIds, metricsByTweetId),
      message: 'Operation successful',
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error('Twitter API request timed out after 5 seconds');
    } else {
      logger.error(
        `Error fetching Twitter/X post metrics: ${safeStringify(error)}`,
      );
    }
    return res.status(200).json({
      data: buildStatsBySource(tweetIds),
      message: 'Operation successful',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export default withSponsorAuth(handler);
