import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Eye,
  Heart,
  Repeat,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface TweetMetrics {
  views: number;
  likes: number;
  retweets: number;
  comments: number;
  isAvailable?: boolean;
}

type TweetSource = 'link' | 'tweet';

interface TweetStatsResponse {
  data: Record<TweetSource, TweetMetrics | null>;
}

const TWEET_STATS_CACHE_TIME = 24 * 60 * 60 * 1000;

const getTweetStatsErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || 'Failed to fetch tweet statistics';
  }

  return error instanceof Error ? error.message : 'Error loading stats';
};

export const TweetStats = ({
  submissionId,
  source,
}: {
  submissionId: string;
  source: TweetSource;
}) => {
  const {
    data: statsBySource,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['tweet-stats', submissionId],
    queryFn: async ({ signal }): Promise<TweetStatsResponse['data']> => {
      const response = await api.get<TweetStatsResponse>(
        '/api/twitter/tweet-stats',
        {
          params: { submissionId },
          signal,
        },
      );

      return response.data.data;
    },
    staleTime: TWEET_STATS_CACHE_TIME,
    gcTime: TWEET_STATS_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  if (isLoading) {
    return (
      <div
        aria-live="polite"
        className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 motion-safe:animate-pulse dark:border-slate-800 dark:bg-slate-900/40"
        role="status"
      >
        <Loader2
          aria-hidden
          className="h-4 w-4 text-slate-400 motion-safe:animate-spin"
        />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Fetching X post metrics...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mb-4 flex max-w-md items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30"
        role="alert"
      >
        <AlertCircle
          aria-hidden
          className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
        />
        <p className="flex-1 text-xs font-medium text-red-700 dark:text-red-300">
          {getTweetStatsErrorMessage(error)}
        </p>
        <Button
          onClick={() => void refetch()}
          size="sm"
          type="button"
          variant="outline"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!statsBySource) return null;

  const metrics = statsBySource[source];

  if (!metrics) {
    return (
      <div className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
        <AlertCircle
          aria-hidden
          className="h-4 w-4 text-slate-500 dark:text-slate-400"
        />
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          No X post stats are available for this submission.
        </p>
      </div>
    );
  }

  return <TweetStatsCard metrics={metrics} source={source} />;
};

const TweetStatsCard = ({
  metrics,
  source,
}: {
  metrics: TweetMetrics;
  source: TweetSource;
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <div className="group relative mb-4 max-w-md overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-slate-200/80 hover:bg-slate-50/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900/40">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <svg
            aria-hidden
            className="h-3 w-3 fill-slate-700 dark:fill-slate-300"
            viewBox="0 0 24 24"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            {source === 'link' ? 'Main Submission' : 'Tweet Link'} · X
          </span>
        </div>
        {metrics.isAvailable === false && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Unavailable
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-100/50">
          <Eye aria-hidden className="mb-1 h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {formatNumber(metrics.views)}
          </span>
          <span className="text-[9px] font-medium text-slate-400">Views</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-100/50">
          <Heart
            aria-hidden
            className="mb-1 h-4 w-4 fill-rose-500/10 text-rose-500"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {formatNumber(metrics.likes)}
          </span>
          <span className="text-[9px] font-medium text-slate-400">Likes</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-100/50">
          <Repeat aria-hidden className="mb-1 h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {formatNumber(metrics.retweets)}
          </span>
          <span className="text-[9px] font-medium text-slate-400">Reposts</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-100/50">
          <MessageSquare aria-hidden className="mb-1 h-4 w-4 text-sky-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {formatNumber(metrics.comments)}
          </span>
          <span className="text-[9px] font-medium text-slate-400">Replies</span>
        </div>
      </div>
    </div>
  );
};
