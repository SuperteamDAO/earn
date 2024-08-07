import { Box, Flex } from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import type { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

import { InstallPWAModal } from '@/components/modals/InstallPWAModal';
import { EmptySection } from '@/components/shared/EmptySection';
import { CombinedRegions } from '@/constants/Superteam';
import { GrantsCard, type GrantWithApplicationCount } from '@/features/grants';
import {
  getGrants,
  getListings,
  type Listing,
  ListingSection,
  ListingTabs,
} from '@/features/listings';
import { Home } from '@/layouts/Home';
import { prisma } from '@/prisma';

interface Props {
  bounties: Listing[];
  grants: GrantWithApplicationCount[];
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
  const session = await getSession(context);
  let userRegion;

  if (session?.user?.id) {
    const user = await prisma.user.findFirst({
      where: { id: session.user.id },
      select: { location: true },
    });

    const matchedRegion = CombinedRegions.find((region) =>
      region.country.includes(user?.location!),
    );

    userRegion = matchedRegion ? matchedRegion.region : Regions.GLOBAL;
  }

  const openListings = await getListings({
    order: 'asc',
    statusFilter: 'open',
    userRegion,
  });

  const reviewListings = await getListings({
    order: 'desc',
    statusFilter: 'review',
    userRegion,
  });

  const completeListings = await getListings({
    order: 'desc',
    statusFilter: 'completed',
    userRegion,
  });

  const bounties = [...openListings, ...reviewListings, ...completeListings];
  const grants = await getGrants({ userRegion });

  return {
    props: {
      bounties: JSON.parse(JSON.stringify(bounties)),
      grants: JSON.parse(JSON.stringify(grants)),
    },
  };
};
