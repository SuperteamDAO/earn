import { Flex, type FlexProps, Link } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useMemo } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { Superteams } from '@/constants/Superteam';
import { CATEGORY_NAV_ITEMS } from '@/features/navbar';
import { useUser } from '@/store/user';

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

const fetchRegionLiveCount = async (region: string) => {
  const { data } = await axios.get<{ count: number }>(
    '/api/listings/region-live-count',
    { params: { region: region.toLowerCase() } },
  );
  return data;
};

export function NavTabs({ ...flexProps }: FlexProps) {
  const { user } = useUser();

  const superteam = useMemo(() => {
    return (
      Superteams.find((s) => s.country.includes(user?.location ?? '')) ?? null
    );
  }, [user?.location]);

  const { data: regionLiveCount, refetch } = useQuery({
    queryKey: ['regionLiveCount', superteam],
    queryFn: () => fetchRegionLiveCount(superteam!.region),
    enabled: false,
  });

  useEffect(() => {
    if (superteam) {
      refetch();
    }
  }, [superteam, refetch]);

  const showRegionTab = superteam && (regionLiveCount?.count ?? 0) > 0;

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
      {showRegionTab && (
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
