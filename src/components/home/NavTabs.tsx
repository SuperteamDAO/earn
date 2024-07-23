import { Flex, type FlexProps, Link } from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Superteams } from '@/constants/Superteam';
import { CATEGORY_NAV_ITEMS } from '@/features/navbar';
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
      py={{ base: 0, sm: 0.5 }}
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

export function NavTabs({ ...flexProps }: FlexProps) {
  const { userInfo } = userStore();
  const [superteam, setSuperteam] = useState<(typeof Superteams)[0] | null>(
    null,
  );
  async function showRegionTab() {
    try {
      const superteam = Superteams.find((s) =>
        s.country.includes(userInfo?.location ?? ''),
      );
      if (superteam) {
        const bountiesCount = await axios.get<{ count: number }>(
          '/api/listings/region-live-count',
          {
            params: {
              region: superteam.region.toLowerCase(),
            },
          },
        );
        if (bountiesCount.data.count > 0) {
          setSuperteam(superteam);
        }
      }
    } catch (err) {
      console.log('Failed to get bounties count', err);
    }
  }
  useEffect(() => {
    showRegionTab();
  }, [userInfo]);
  return (
    <Flex
      align="center"
      wrap="wrap"
      rowGap={2}
      columnGap={3}
      mb={6}
      {...flexProps}
    >
      <PillTab href="/" altActive={['/all/']} phEvent="all_navpill">
        All Opportunities
      </PillTab>
      {superteam && (
        <PillTab
          href={`/regions/${superteam.region.toLowerCase()}/`}
          phEvent={`${superteam.region.toLowerCase()}_navpill`}
        >
          {superteam.code && <UserFlag location={superteam.code} isCode />}
          {superteam.displayValue}
        </PillTab>
      )}
      {CATEGORY_NAV_ITEMS?.map((navItem) => {
        return (
          <PillTab
            altActive={navItem.altActive}
            href={navItem.href}
            phEvent={navItem.pillPH}
            key={navItem.label}
          >
            {navItem.label}
          </PillTab>
        );
      })}
    </Flex>
  );
}
