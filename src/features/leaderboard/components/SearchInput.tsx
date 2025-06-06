import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Input } from '@/components/ui/input';

interface Props {
  onSearch: (value: string) => void;
  isLoading?: boolean;
  currSearch?: string;
}

export function SearchInput({ onSearch, isLoading, currSearch }: Props) {
  const [value, setValue] = useState(currSearch || '');

  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      onSearch(searchValue);
    }, 500),
    [onSearch],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  return (
    <div className="relative flex items-center">
      <Input
        autoFocus
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search..."
        className="h-7 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-300 focus:outline-none"
      />
      <div className="absolute right-2 flex h-5 w-5 items-center justify-center">
        {isLoading ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        ) : (
          <Search className="h-3 w-3 text-slate-400" />
        )}
      </div>
    </div>
  );
}
