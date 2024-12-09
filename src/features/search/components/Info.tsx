import { Loader2 } from 'lucide-react';

interface Props {
  count: number;
  query: string;
  loading: boolean;
}

export function Info({ count, query, loading }: Props) {
  return (
    <div className="px-1 py-4 sm:px-4">
      <div className="flex gap-2">
        <p className="text-sm font-semibold text-slate-700">
          {query.length === 0
            ? 'Enter a keyword to find what you need.'
            : `Found ${count} search results`}
        </p>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      {query.length > 0 && (
        <p className="text-sm font-medium text-slate-500">
          for {`"${query.trim()}"`}
        </p>
      )}
    </div>
  );
}
