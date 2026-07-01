import { useEffect, useState } from 'react';
import { Eye, Heart, Repeat, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

interface TweetMetrics {
  views: number;
  likes: number;
  retweets: number;
  comments: number;
  isMocked: boolean;
}

export const TweetStats = ({ url }: { url: string }) => {
  const [metrics, setMetrics] = useState<TweetMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/twitter/tweet-stats?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
          throw new Error('Failed to fetch tweet statistics');
        }
        const data = await res.json();
        if (active) {
          setMetrics(data);
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
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 py-2.5 px-3 mb-4 bg-slate-50/50 border border-slate-100 rounded-xl animate-pulse max-w-md">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">Fetching X post metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 py-2.5 px-3 mb-4 bg-red-50/30 border border-red-100/50 rounded-xl max-w-md">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-xs text-red-600 font-medium">{error}</span>
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
    <div className="group relative overflow-hidden bg-white hover:bg-slate-50/30 border border-slate-100 hover:border-slate-200/80 rounded-xl p-3 mb-4 transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md max-w-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <svg className="h-3 w-3 fill-slate-700" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            X Post Engagement
          </span>
        </div>
        {metrics.isMocked && (
          <span className="text-[9px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
            Simulated
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-slate-100/50 transition-colors duration-150">
          <Eye className="h-4 w-4 text-blue-500 mb-1" />
          <span className="text-xs font-semibold text-slate-700">{formatNumber(metrics.views)}</span>
          <span className="text-[9px] text-slate-400 font-medium">Views</span>
        </div>

        <div className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-slate-100/50 transition-colors duration-150">
          <Heart className="h-4 w-4 text-rose-500 mb-1 fill-rose-500/10" />
          <span className="text-xs font-semibold text-slate-700">{formatNumber(metrics.likes)}</span>
          <span className="text-[9px] text-slate-400 font-medium">Likes</span>
        </div>

        <div className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-slate-100/50 transition-colors duration-150">
          <Repeat className="h-4 w-4 text-emerald-500 mb-1" />
          <span className="text-xs font-semibold text-slate-700">{formatNumber(metrics.retweets)}</span>
          <span className="text-[9px] text-slate-400 font-medium">Reposts</span>
        </div>

        <div className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-slate-100/50 transition-colors duration-150">
          <MessageSquare className="h-4 w-4 text-sky-500 mb-1" />
          <span className="text-xs font-semibold text-slate-700">{formatNumber(metrics.comments)}</span>
          <span className="text-[9px] text-slate-400 font-medium">Replies</span>
        </div>
      </div>
    </div>
  );
};
