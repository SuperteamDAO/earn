import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

function extractTweetId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const trimmed = url.trim();
    const urlWithProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
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

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { url: tweetUrl } = req.query;

  if (!tweetUrl || typeof tweetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid tweetUrl parameter' });
  }

  const tweetId = extractTweetId(tweetUrl);
  if (!tweetId) {
    return res.status(400).json({ error: 'Invalid Twitter/X post URL' });
  }

  const bearerToken = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    logger.warn('Twitter/X API bearer token is not configured. Returning simulated mock metrics.');
    // Generate deterministic mock stats based on the tweetId
    const seed = parseInt(tweetId.slice(-4), 10) || 1234;
    const views = Math.floor(seed * 1.5) + 120;
    const likes = Math.floor(views * 0.08) + 5;
    const retweets = Math.floor(likes * 0.15) + 1;
    const comments = Math.floor(likes * 0.10) + 1;

    return res.status(200).json({
      views,
      likes,
      retweets,
      comments,
      isMocked: true,
    });
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      logger.error(`Twitter API responded with status ${response.status}: ${await response.text()}`);
      // Fallback to mock data if API limits or errors occur
      const seed = parseInt(tweetId.slice(-4), 10) || 1234;
      const views = Math.floor(seed * 1.5) + 120;
      const likes = Math.floor(views * 0.08) + 5;
      const retweets = Math.floor(likes * 0.15) + 1;
      const comments = Math.floor(likes * 0.10) + 1;
      return res.status(200).json({
        views,
        likes,
        retweets,
        comments,
        isMocked: true,
      });
    }

    const json = await response.json();
    const metrics = json.data?.public_metrics;

    if (!metrics) {
      return res.status(404).json({ error: 'Tweet not found or metrics unavailable' });
    }

    return res.status(200).json({
      views: metrics.impression_count || 0,
      likes: metrics.like_count || 0,
      retweets: (metrics.retweet_count || 0) + (metrics.quote_count || 0),
      comments: metrics.reply_count || 0,
      isMocked: false,
    });
  } catch (error) {
    logger.error('Error fetching Twitter/X post metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch Twitter/X post metrics' });
  }
}

export default withAuth(handler);
