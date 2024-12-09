import { Loader2, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface Props {
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
}

export function QueryInput({ loading, query, setQuery }: Props) {
  return (
    <div className="ph-no-capture w-full max-w-xl px-1 sm:px-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="ph-no-capture rounded-md border-slate-300 pl-9 pr-10 text-sm font-medium text-slate-600 md:text-base"
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for Superteam Earn Listings"
          value={query}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
    </div>
  );
}
