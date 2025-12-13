import { useEffect, useState } from 'react';

import { countries } from '@/constants/country';
import { CUSTOM_FLAGS } from '@/constants/CUSTOM_FLAGS';
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
      setTimeout(() => {
        setCode(lowerCaseCode);
        setIsCustomFlag(!!CUSTOM_FLAGS[lowerCaseCode]);
      }, 0);
    } else {
      const country = countries.find(
        (c) => c.name.toLowerCase() === location.toLowerCase(),
      );
      if (country) {
        const lowerCaseCode = country.code.toLowerCase();
        setTimeout(() => {
          setCode(lowerCaseCode);
          setIsCustomFlag(!!CUSTOM_FLAGS[lowerCaseCode]);
        }, 0);
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
