import '/node_modules/flag-icons/css/flag-icons.min.css';

import { Center } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { countries } from '@/constants';

interface Props {
  location: string;
  size?:
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
    console.log('location', location);
  }, [location]);
  return code === 'balkan' ? (
    <Center
      bgImage={'/assets/superteams/logos/balkan.png'}
      bgSize={'contain'}
      borderWidth="1px"
      borderStyle="solid"
      borderColor="brand.slate.50"
      rounded="full"
      style={{ width: size, height: size }}
    />
  ) : (
    <Center
      className={`fi fi-${code} fis`}
      borderWidth="1px"
      borderStyle="solid"
      borderColor="brand.slate.50"
      rounded="full"
      style={{ width: size, height: size }}
    />
  );
}
