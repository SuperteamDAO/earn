import { Flex, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Superteams } from '@/constants/Superteam';
import { userStore } from '@/store/user';

import { UserFlag } from '../shared/UserFlag';

interface PillTabProps {
  href: string;
  altActive?: string[];
  children: React.ReactNode;
}
function PillTab({ href, children, altActive }: PillTabProps) {
  const router = useRouter();
  return (
    <Link
      as={NextLink}
      alignItems="center"
      gap={2}
      display="flex"
      px={3}
      color={router.asPath === href ? 'black' : 'brand.slate.500'}
      fontSize={'sm'}
      bg={
        router.asPath === href || altActive?.includes(router.asPath)
          ? '#F5F3FF'
          : 'white'
      }
      borderWidth={1}
      borderColor="brand.slate.200"
      _hover={{
        textDecoration: 'none',
        bg: '#F5F3FF',
      }}
      href={href}
      rounded="full"
    >
      {children}
    </Link>
  );
}

export function NavTabs() {
  const { userInfo } = userStore();
  const [superteam, setSuperteam] = useState<(typeof Superteams)[0] | null>(
    null,
  );
  useEffect(() => {
    console.log('user location - ', userInfo?.location);
    const superteam = Superteams.find((s) =>
      s.country.includes(userInfo?.location ?? ''),
    );
    console.log('user code - ', superteam?.code);
    if (superteam) {
      setSuperteam(superteam);
    }
  }, [userInfo]);
  useEffect(() => {
    console.log('superteam code - ', superteam?.code);
  }, [superteam]);
  return (
    <Flex align="center" wrap="wrap" rowGap={2} columnGap={3} mb={6}>
      <PillTab href="/" altActive={['/all/']}>
        All Opportunities
      </PillTab>
      {superteam && (
        <PillTab href={`/regions/${superteam.region.toLowerCase()}/`}>
          {superteam.code && <UserFlag location={superteam.code} isCode />}
          {superteam.displayValue}
        </PillTab>
      )}
      <PillTab altActive={['/category/content/all/']} href="/category/content/">
        Content
      </PillTab>
      <PillTab altActive={['/category/design/all/']} href="/category/design/">
        Design
      </PillTab>
      <PillTab
        altActive={['/category/development/all/']}
        href="/category/development/"
      >
        Development
      </PillTab>
      <PillTab altActive={['/category/other/all/']} href="/category/other/">
        Other
      </PillTab>
    </Flex>
  );
}
