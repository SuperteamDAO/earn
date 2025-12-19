import { atom, useAtom } from 'jotai';
import { CornerDownLeft, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';

interface Props {
  onSearch: (value: string) => void;
  isLoading?: boolean;
  currSearch?: string;
}

const autofocus = atom(false);

export function SearchInput({ onSearch, isLoading, currSearch }: Props) {
  const [value, setValue] = useState(currSearch || '');
  const [shouldFocus, setFocus] = useAtom(autofocus);

  const hasInput = value.trim().length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFocus(true);
    setValue(e.target.value);
  };

  const handleSearch = () => {
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      handleSearch();
    }
  };

  return (
    <div className="relative flex items-center">
      <Input
        autoFocus={shouldFocus}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        className="h-7 w-full rounded-md border border-slate-200 bg-white px-3 py-1 pr-8 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:ring-1 focus:ring-slate-300 focus:outline-none"
      />
      <div className="absolute right-2 flex h-5 w-5 items-center justify-center">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0.5, filter: 'blur(2px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0.5, filter: 'blur(2px)' }}
              transition={{ duration: 0.1 }}
              className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
            />
          ) : hasInput ? (
            <motion.button
              key="enter"
              initial={{ opacity: 0.5, filter: 'blur(2px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0.5, filter: 'blur(2px)' }}
              transition={{ duration: 0.1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSearch}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 ring-0 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:ring-slate-300 focus:ring-offset-1 focus:outline-none"
              aria-label="Search"
            >
              <CornerDownLeft className="h-3 w-3" />
            </motion.button>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0.5, filter: 'blur(2px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0.5, filter: 'blur(2px)' }}
              transition={{ duration: 0.1 }}
            >
              <Search className="h-3 w-3 text-slate-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
