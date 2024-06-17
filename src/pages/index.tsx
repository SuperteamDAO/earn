import { Box, Flex } from '@chakra-ui/react';
import { type BountyType } from '@prisma/client';
import type { GetServerSideProps } from 'next';

import { InstallPWAModal } from '@/components/modals/InstallPWAModal';
import { EmptySection } from '@/components/shared/EmptySection';
import { type Grant, GrantsCard } from '@/features/grants';
import { type Bounty, ListingSection, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';

import { getListings, type Skills, type Status } from './api/listings/v2';

interface Props {
  bounties: Bounty[];
  grants: Grant[];
}

export default function HomePage({ bounties, grants }: Props) {
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
          checkLanguage
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

  const category = params.category as string | undefined;
  const order = (params.order as 'asc' | 'desc') ?? 'asc';
  const isHomePage = params.isHomePage === 'true';

  const skillFilter = params.skill as Skills | undefined;
  const statusFilter: Status = (params.status as Status) ?? 'open';
  const type = params.type as BountyType | undefined;
  const take = params.take ? parseInt(params.take as string, 20) : 20;

  console.log('status - ', statusFilter);

  const openResult = await getListings({
    category,
    order,
    isHomePage,
    skillFilter,
    statusFilter: 'open',
    type,
    take,
  });

  const reviewResult = await getListings({
    category: 'bounties',
    order: 'desc',
    isHomePage,
    skillFilter,
    statusFilter: 'review',
    type,
    take,
  });

  const completeResult = await getListings({
    category: 'bounties',
    order: 'desc',
    isHomePage,
    skillFilter,
    statusFilter: 'completed',
    type,
    take,
  });

  const result: {
    bounties: Bounty[];
    grants: Grant[];
  } = {
    bounties: [
      ...openResult.bounties,
      ...reviewResult.bounties,
      ...completeResult.bounties,
    ],
    grants: openResult.grants,
  };

  return {
    props: JSON.parse(JSON.stringify(result)),
  };
};
