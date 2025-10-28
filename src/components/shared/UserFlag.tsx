'use client';
import { useEffect, useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { countries } from '@/constants/country';
import { cn } from '@/utils/cn';

import 'flag-icons/css/flag-icons.min.css';

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

export const CUSTOM_FLAGS: Record<string, string> = {
  balkan: `${ASSET_URL}/superteams/logos/balkan.png`,
  latam: `${ASSET_URL}/regions/latam`,
  'north-america': `${ASSET_URL}/regions/north-america`,
  gcc: `${ASSET_URL}/regions/gcc`,
};

interface Props {
  location: string;
  size?: FlagSize;
  isCode?: boolean;
}

export function UserFlag({ location, size = '16px', isCode = false }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [isCustomFlag, setIsCustomFlag] = useState<boolean>(false);

  useEffect(() => {
    if (isCode) {
      const lowerCaseCode = location.toLowerCase();
      setCode(lowerCaseCode);
      setIsCustomFlag(!!CUSTOM_FLAGS[lowerCaseCode]);
    } else {
      const country = countries.find(
        (c) => c.name.toLowerCase() === location.toLowerCase(),
      );
      if (country) {
        const lowerCaseCode = country.code.toLowerCase();
        setCode(lowerCaseCode);
        setIsCustomFlag(!!CUSTOM_FLAGS[lowerCaseCode]);
      }
    }
  }, [location, isCode]);

  const flagStyles = {
    width: size,
    height: size,
  };

  if (!code) {
    return null;
  }

  return isCustomFlag ? (
    <div
      className="flex items-center justify-center rounded-full border border-slate-50 bg-contain bg-center bg-no-repeat"
      style={{
        ...flagStyles,
        backgroundImage: `url('${CUSTOM_FLAGS[code]}')`,
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
