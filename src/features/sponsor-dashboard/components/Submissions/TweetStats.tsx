import {
  Eye,
  Heart,
  Repeat,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface TweetMetrics {
  views: number;
  likes: number;
  retweets: number;
  comments: number;
  isMocked: boolean;
  isAvailable?: boolean;
}

export const TweetStats = ({
  submissionId,
  type,
}: {
  submissionId: string;
  type: 'link' | 'tweet';
}) => {
  const [metrics, setMetrics] = useState<TweetMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/twitter/tweet-stats?submissionId=${submissionId}&type=${type}`,
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.message || 'Failed to fetch tweet statistics',
          );
        }
        const json = await res.json();
        if (active) {
          setMetrics(json.data);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Error loading stats');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchStats();
    return () => {
      active = false;
    };
  }, [submissionId, type]);

  if (loading) {
    return (
      <div className="mb-4 flex max-w-md animate-pulse items-center space-x-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-xs font-medium text-slate-400">
          Fetching X post metrics...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 flex max-w-md items-center space-x-2 rounded-xl border border-red-100/50 bg-red-50/30 px-3 py-2.5">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-xs font-medium text-red-600">{error}</span>
      </div>
    );
  }

  if (!metrics) return null;

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
    <div className="group relative mb-4 max-w-md overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-slate-200/80 hover:bg-slate-50/30 hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <svg className="h-3 w-3 fill-slate-700" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            X Post Engagement
          </span>
        </div>
        {metrics.isMocked && (
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
            Simulated
          </span>
        )}
        {metrics.isAvailable === false && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Unavailable
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-100/50">
          <Eye className="mb-1 h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold text-slate-700">
            {formatNumber(metrics.views)}
          </span>
          <span className="text-[9px] font-medium text-slate-400">Views</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-100/50">
          <Heart className="mb-1 h-4 w-4 fill-rose-500/10 text-rose-500" />
          <span className="text-xs font-semibold text-slate-700">
            {formatNumber(metrics.likes)}
          </span>
          <span className="text-[9px] font-medium text-slate-400">Likes</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-100/50">
          <Repeat className="mb-1 h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-700">
            {formatNumber(metrics.retweets)}
          </span>
          <span className="text-[9px] font-medium text-slate-400">Reposts</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-100/50">
          <MessageSquare className="mb-1 h-4 w-4 text-sky-500" />
          <span className="text-xs font-semibold text-slate-700">
            {formatNumber(metrics.comments)}
          </span>
          <span className="text-[9px] font-medium text-slate-400">Replies</span>
        </div>
      </div>
    </div>
  );
};
