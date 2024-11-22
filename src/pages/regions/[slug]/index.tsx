import { Box, Flex } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';
import React from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { Superteams } from '@/constants/Superteam';
import { GrantsCard } from '@/features/grants';
import {
  ListingSection,
  ListingTabs,
  regionalListingsQuery,
} from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { getURL } from '@/utils/validUrl';

const RegionsPage = ({
  slug,
  displayName,
  st,
}: {
  slug: string;
  displayName: string;
  st: (typeof Superteams)[0];
}) => {
  const { data: listings, isLoading: isListingsLoading } = useQuery(
    regionalListingsQuery({ region: slug, take: 10 }),
  );

  const ogImage = new URL(`${getURL()}api/dynamic-og/region/`);
  ogImage.searchParams.set('region', st.displayValue);
  ogImage.searchParams.set('code', st.code!);

  return (
    <>
      <Home type="region" st={st}>
        <Meta
          title={`Welcome to Solar Earn ${displayName} | Discover Bounties and Grants`}
          description={`Welcome to Solar ${displayName}'s page — Discover bounties and grants and become a part of the global crypto community`}
          canonical={`https://earn.superteam.fun/regions/${slug}/`}
          og={ogImage.toString()}
        />
        <Box w={'100%'}>
          <ListingTabs
            bounties={listings?.bounties}
            isListingsLoading={isListingsLoading}
            emoji="/assets/home/emojis/moneyman.webp"
            title="Freelance Gigs"
            showViewAll
            viewAllLink={`/regions/${slug}/all`}
            take={10}
          />

          <ListingSection
            type="grants"
            title="Grants"
            sub="为建设者提供资金支持"
            emoji="/assets/home/emojis/grants.webp"
          >
            {isListingsLoading && (
              <Flex
                align="center"
                justify="center"
                direction="column"
                minH={52}
              >
                <Loading />
              </Flex>
            )}
            {!isListingsLoading && !listings?.grants?.length && (
              <Flex align="center" justify="center" mt={8}>
                <EmptySection
                  title="暂无资助可申请！"
                  message="订阅通知以便接收关于新资助项目的通知。"
                />
              </Flex>
            )}
            {!isListingsLoading &&
              listings?.grants?.map((grant) => {
                return <GrantsCard grant={grant} key={grant.id} />;
              })}
          </ListingSection>
        </Box>
      </Home>
    </>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;

  const st = Superteams.find((team) => team.region.toLowerCase() === slug);
  const displayName = st?.displayValue;

  const validRegion = Superteams.some(
    (team) => team.region.toLowerCase() === (slug as string).toLowerCase(),
  );

  if (!validRegion) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug, displayName, st },
  };
}

export default RegionsPage;
