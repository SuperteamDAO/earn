import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';

interface TweetMetrics {
  readonly views: number;
  readonly likes: number;
  readonly retweets: number;
  readonly comments: number;
  readonly isAvailable: boolean;
}

export interface TweetStats {
  readonly data: {
    readonly link: TweetMetrics | null;
    readonly tweet: TweetMetrics | null;
  };
  readonly message: string;
}

export class SubmissionNotFound extends Schema.TaggedError<SubmissionNotFound>()(
  'SubmissionNotFound',
  {},
) {
  override get message() {
    return 'Submission not found';
  }
}

// The status id of an X (Twitter) post link, else null.
export function extractTweetId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const parsed = URL.parse(
    trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
  );
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  if (!host.includes('twitter.com') && !host.includes('x.com')) return null;
  const segments = parsed.pathname.split('/').filter(Boolean);
  const statusIndex = segments.indexOf('status');
  if (statusIndex === -1) return null;
  const id = segments[statusIndex + 1];
  return id && /^\d+$/.test(id) ? id : null;
}

const PublicMetrics = Schema.Struct({
  impression_count: Schema.optional(Schema.Finite),
  like_count: Schema.optional(Schema.Finite),
  quote_count: Schema.optional(Schema.Finite),
  reply_count: Schema.optional(Schema.Finite),
  retweet_count: Schema.optional(Schema.Finite),
});
type PublicMetrics = typeof PublicMetrics.Type;

const Tweets = Schema.Struct({
  data: Schema.optional(
    Schema.Array(
      Schema.Struct({
        id: Schema.optional(Schema.String),
        public_metrics: Schema.optional(PublicMetrics),
      }),
    ),
  ),
});

// X's numbers as the review table shows them: quotes count as reposts.
function toTweetMetrics(metrics: PublicMetrics | undefined): TweetMetrics {
  if (!metrics) {
    return { views: 0, likes: 0, retweets: 0, comments: 0, isAvailable: false };
  }
  return {
    views: metrics.impression_count || 0,
    likes: metrics.like_count || 0,
    retweets: (metrics.retweet_count || 0) + (metrics.quote_count || 0),
    comments: metrics.reply_count || 0,
    isAvailable: true,
  };
}

const OK = 'Operation successful';

// A submission's X post stats for its sponsor's review, from X's API, as
// Earn's /api/twitter/tweet-stats. X failing (or no token) answers zeros.
export class TweetStatsReader extends Context.Service<
  TweetStatsReader,
  {
    // Only for a submission to one of the sponsor's own listings, unless
    // they're in God mode.
    readonly forSubmission: (
      submissionId: string,
      viewer: { readonly sponsorId: string; readonly god: boolean },
    ) => Effect.Effect<TweetStats, SubmissionNotFound | Database.DatabaseError>;
  }
>()('earn/TweetStats') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const database = yield* Database.Database;

  const fetchMetrics = (ids: ReadonlyArray<string>) =>
    Effect.gen(function* () {
      const token = config.xBearerToken;
      if (!token) {
        yield* Effect.logWarning('X bearer token not configured; zero stats');
        return new Map<string, PublicMetrics>();
      }
      const url = new URL('https://api.twitter.com/2/tweets');
      url.searchParams.set('ids', ids.join(','));
      url.searchParams.set('tweet.fields', 'public_metrics');
      const body = yield* Effect.tryPromise(async (): Promise<unknown> => {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${Redacted.value(token)}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error(`X answered ${response.status}`);
        return response.json();
      }).pipe(
        Effect.catch(() =>
          Effect.logError('Fetching X post metrics failed').pipe(
            Effect.as(null),
          ),
        ),
      );
      const tweets = Schema.decodeUnknownOption(Tweets)(body);
      const metrics = new Map<string, PublicMetrics>();
      if (Option.isSome(tweets)) {
        for (const tweet of tweets.value.data ?? []) {
          if (tweet.id && tweet.public_metrics) {
            metrics.set(tweet.id, tweet.public_metrics);
          }
        }
      }
      return metrics;
    });

  const forSubmission = Effect.fn('TweetStats.forSubmission')(function* (
    submissionId: string,
    viewer: { readonly sponsorId: string; readonly god: boolean },
  ) {
    const submission = yield* database.query('tweetStatsSubmission', (client) =>
      client.submission.findFirst({
        where: viewer.god
          ? { id: submissionId }
          : { id: submissionId, listing: { sponsorId: viewer.sponsorId } },
        select: { link: true, tweet: true },
      }),
    );
    if (!submission) return yield* new SubmissionNotFound();
    const ids = {
      link: submission.link ? extractTweetId(submission.link) : null,
      tweet: submission.tweet ? extractTweetId(submission.tweet) : null,
    };
    const unique = [
      ...new Set([ids.link, ids.tweet].filter((id) => id !== null)),
    ];
    const stats = (metrics: Map<string, PublicMetrics>) => ({
      link: ids.link ? toTweetMetrics(metrics.get(ids.link)) : null,
      tweet: ids.tweet ? toTweetMetrics(metrics.get(ids.tweet)) : null,
    });
    if (unique.length === 0) {
      return {
        data: stats(new Map()),
        message: 'No valid Twitter/X post URLs found in submission',
      };
    }
    return { data: stats(yield* fetchMetrics(unique)), message: OK };
  });

  return TweetStatsReader.of({ forSubmission });
});

export const layer = Layer.effect(TweetStatsReader, make);
