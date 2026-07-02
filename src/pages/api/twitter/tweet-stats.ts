import type { NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

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
  url: z
    .string({
      required_error: 'Missing or invalid tweetUrl parameter',
    })
    .trim()
    .min(1, 'Missing or invalid tweetUrl parameter')
    .refine((url) => !!extractTweetId(url), {
      message: 'Invalid Twitter/X post URL',
    }),
});

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const validation = tweetStatsQuerySchema.safeParse(req.query);

  if (!validation.success) {
    const errorMessage = validation.error.errors
      .map((err) => err.message)
      .join(', ');
    logger.warn(`Tweet stats validation failed: ${errorMessage}`);
    return res.status(403).json({
      error: errorMessage,
      message: 'Validation failed: Invalid request query parameters',
    });
  }

  const { url: tweetUrl } = validation.data;
  const tweetId = extractTweetId(tweetUrl)!;

  const bearerToken =
    process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    logger.warn(
      'Twitter/X API bearer token is not configured. Returning 0 metrics.',
    );
    return res.status(200).json({
      data: {
        views: 0,
        likes: 0,
        retweets: 0,
        comments: 0,
        isMocked: false,
        isAvailable: false,
      },
      message: 'Operation successful',
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      logger.error(
        `Twitter API responded with status ${response.status}: ${await response.text()}`,
      );
      return res.status(200).json({
        data: {
          views: 0,
          likes: 0,
          retweets: 0,
          comments: 0,
          isMocked: false,
          isAvailable: false,
        },
        message: 'Operation successful',
      });
    }

    const json = await response.json();
    const metrics = json.data?.public_metrics;

    if (!metrics) {
      logger.warn(
        `Metrics not found in Twitter API response for tweetId: ${tweetId}`,
      );
      return res.status(200).json({
        data: {
          views: 0,
          likes: 0,
          retweets: 0,
          comments: 0,
          isMocked: false,
          isAvailable: false,
        },
        message: 'Operation successful',
      });
    }

    return res.status(200).json({
      data: {
        views: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        retweets: (metrics.retweet_count || 0) + (metrics.quote_count || 0),
        comments: metrics.reply_count || 0,
        isMocked: false,
        isAvailable: true,
      },
      message: 'Operation successful',
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error('Twitter API request timed out after 5 seconds');
    } else {
      logger.error('Error fetching Twitter/X post metrics:', error);
    }
    return res.status(200).json({
      data: {
        views: 0,
        likes: 0,
        retweets: 0,
        comments: 0,
        isMocked: false,
        isAvailable: false,
      },
      message: 'Operation successful',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export default withAuth(handler);
