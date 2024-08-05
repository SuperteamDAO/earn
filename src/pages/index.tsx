import { Box, Flex } from '@chakra-ui/react';
import { type BountyType } from '@prisma/client';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { InstallPWAModal } from '@/components/modals/InstallPWAModal';
import { EmptySection } from '@/components/shared/EmptySection';
import { GrantsCard, type GrantWithApplicationCount } from '@/features/grants';
import { type Listing, ListingSection, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { userStore } from '@/store/user';

import { getGrants, getListings, type Skills } from './api/listings/homepage';

interface Props {
  bounties: Listing[];
  grants: GrantWithApplicationCount[];
}

export default function HomePage({ bounties, grants }: Props) {
  const router = useRouter();

  useEffect(() => {
    const { userInfo } = userStore.getState();
    const location = userInfo?.location;

    if (location) {
      const upperCaseLocation = location.toLocaleUpperCase();
      router.replace({
        pathname: '/',
        query: { Location: upperCaseLocation },
      });
    }
  }, [router]);

  return (
    <Home type="home">
      <InstallPWAModal />
      <Box w={'100%'}>
        <ListingTabs
          bounties={bounties}
          isListingsLoading={false}
          emoji="/assets/home/emojis/moneyman.png"
          title="Freelance Gigs"
          viewAllLink="/all"
          take={20}
          showViewAll
        />
        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
          showViewAll
        >
          {!grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </Flex>
          )}
          {grants &&
            grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection>
      </Box>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const params = context.query;
  const userLocation = params.Location as string | undefined;

  const skillFilter = params.skill as Skills | undefined;
  const type = params.type as BountyType | undefined;
  const take = params.take ? parseInt(params.take as string, 10) : 20;

  const openResult = await getListings({
    order: 'asc',
    skillFilter,
    statusFilter: 'open',
    type,
    take,
    userLocation: userLocation,
  });

  const reviewResult = await getListings({
    order: 'desc',
    skillFilter,
    statusFilter: 'review',
    type,
    take,
    userLocation: userLocation,
  });

  const grants = await getGrants({ take, skillFilter });

  const completeResult = await getListings({
    order: 'desc',
    skillFilter,
    statusFilter: 'completed',
    type,
    take,
    userLocation: userLocation,
  });

  const result: {
    bounties: Listing[];
    grants: GrantWithApplicationCount[];
  } = {
    bounties: [...(openResult as any), ...reviewResult, ...completeResult],
    grants: grants as any,
  };

  return {
    props: JSON.parse(JSON.stringify(result)),
  };
};
