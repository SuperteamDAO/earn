import { Flex, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Superteams } from '@/constants/Superteam';
import { userStore } from '@/store/user';

import { UserFlag } from '../shared/UserFlag';

interface PillTabProps {
  href: string;
  altActive?: string[];
  children: React.ReactNode;
  phEvent: string;
}
function PillTab({ href, children, altActive, phEvent }: PillTabProps) {
  const router = useRouter();
  const posthog = usePostHog();
  return (
    <Link
      className="ph-no-capture"
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
      onClick={() => posthog.capture(phEvent)}
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
    const superteam = Superteams.find((s) =>
      s.country.includes(userInfo?.location ?? ''),
    );
    if (superteam) {
      setSuperteam(superteam);
    }
  }, [userInfo]);
  return (
    <Flex align="center" wrap="wrap" rowGap={2} columnGap={3} mb={6}>
      <PillTab href="/" altActive={['/all/']} phEvent="all_navbar">
        All Opportunities
      </PillTab>
      {superteam && (
        <PillTab
          href={`/regions/${superteam.region.toLowerCase()}/`}
          phEvent={`${superteam.region.toLowerCase()}_navbar`}
        >
          {superteam.code && <UserFlag location={superteam.code} isCode />}
          {superteam.displayValue}
        </PillTab>
      )}
      <PillTab
        altActive={['/category/content/all/']}
        href="/category/content/"
        phEvent="content_navbar"
      >
        Content
      </PillTab>
      <PillTab
        altActive={['/category/design/all/']}
        href="/category/design/"
        phEvent="design_navbar"
      >
        Design
      </PillTab>
      <PillTab
        altActive={['/category/development/all/']}
        href="/category/development/"
        phEvent="development_navbar"
      >
        Development
      </PillTab>
      <PillTab
        altActive={['/category/other/all/']}
        href="/category/other/"
        phEvent="other_navbar"
      >
        Other
      </PillTab>
    </Flex>
  );
}
