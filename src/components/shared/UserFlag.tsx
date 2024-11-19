import '/node_modules/flag-icons/css/flag-icons.min.css';

import { useEffect, useState } from 'react';

import { countries } from '@/constants';
import { cn } from '@/utils';

type FlagSize =
  | '12px'
  | '14px'
  | '16px'
  | '20px'
  | '24px'
  | '28px'
  | '32px'
  | '36px'
  | '40px'
  | '44px'
  | '52px'
  | '64px';

interface Props {
  location: string;
  size?: FlagSize;
  isCode?: boolean;
}

export function UserFlag({ location, size = '16px', isCode = false }: Props) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (isCode) {
      setCode(location.toLowerCase());
    } else {
      const country = countries.find(
        (c) => c.name.toLowerCase() === location.toLowerCase(),
      );
      if (country) {
        setCode(country.code);
      }
    }
  }, [location, isCode]);

  const flagStyles = {
    width: size,
    height: size,
  };

  return code === 'balkan' ? (
    <div
      className="flex items-center justify-center rounded-full border border-slate-50 bg-contain"
      style={{
        ...flagStyles,
        backgroundImage: "url('/assets/superteams/logos/balkan.png')",
      }}
    />
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border border-slate-50',
        `fi fi-${code} fis`,
      )}
      style={flagStyles}
    />
  );
}
