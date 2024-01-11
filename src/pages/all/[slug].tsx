import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import type { NextPageContext } from 'next';
import { useEffect, useState } from 'react';

import {
  BountiesCard,
  GrantsCard,
  ListingsCardSkeleton,
  ListingSection,
} from '@/components/misc/listingsCard';
import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import type { Bounty } from '@/interface/bounty';
import type { Grant } from '@/interface/grant';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

interface Listings {
  bounties?: Bounty[];
  grants?: Grant[];
}

type SlugKeys = 'Design' | 'Content' | 'Development' | 'Hyperdrive';

function ListingCategoryPage({ slug }: { slug: string }) {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    grants: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    const params =
      slug === 'Hyperdrive'
        ? { category: 'hyperdrive' }
        : { category: 'all', take: 100, filter: slug };
    try {
      const listingsData = await axios.get('/api/listings/', { params });
      setListings(listingsData.data);
      setIsListingsLoading(false);
    } catch (e) {
      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isListingsLoading) return;
    getListings();
  }, []);

  const titlesForSlugs: { [key in SlugKeys]: string } = {
    Design: 'Superteam Earn | Design Bounties and Grants',
    Content: 'Superteam Earn | Content Bounties and Grants',
    Development: 'Superteam Earn | Development Bounties and Grants',
    Hyperdrive: 'Superteam Earn | Apply to Hyperdrive global Solana Hackathon',
  };

  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || 'Superteam Earn'; // Default title if slug not found
  const formattedSlug =
    slug === 'Hyperdrive' ? slug.toUpperCase() : slug.toLowerCase();
  const metaDescription = `Find the latest ${formattedSlug} bounties and grants for freelancers and builders in the crypto space on Superteam Earn.`;
  const canonicalURL = `https://earn.superteam.fun/all/${slug}/`;

  return (
    <Home type="category">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
      />
      <Box w={'100%'}>
        <ListingSection
          type="bounties"
          title={`${slug} Gigs`}
          sub="Bite sized tasks for freelancers"
          emoji="/assets/home/emojis/moneyman.png"
          all
        >
          {isListingsLoading &&
            Array.from({ length: 8 }, (_, index) => (
              <ListingsCardSkeleton key={index} />
            ))}
          {!isListingsLoading && !listings?.bounties?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No bounties available!"
                message="Subscribe to notifications to get notified about new bounties."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            listings?.bounties?.map((bounty) => {
              return (
                <BountiesCard
                  slug={bounty?.slug}
                  rewardAmount={bounty?.rewardAmount}
                  key={bounty?.id}
                  sponsorName={bounty?.sponsor?.name}
                  deadline={bounty?.deadline}
                  title={bounty?.title}
                  logo={bounty?.sponsor?.logo}
                  token={bounty?.token}
                  type={bounty?.type}
                  applicationType={bounty?.applicationType}
                  isWinnersAnnounced={bounty?.isWinnersAnnounced}
                />
              );
            })}
        </ListingSection>
        <ListingSection
          type="grants"
          title={`${slug} Grants`}
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
          all
        >
          {isListingsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          )}
          {!isListingsLoading && !listings?.grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            listings?.grants?.map((grant) => {
              return (
                <GrantsCard
                  sponsorName={grant?.sponsor?.name}
                  logo={grant?.sponsor?.logo}
                  key={grant?.id}
                  slug={grant.slug}
                  rewardAmount={grant?.rewardAmount}
                  title={grant?.title}
                  short_description={grant?.shortDescription}
                />
              );
            })}
        </ListingSection>
      </Box>
    </Home>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;

  const validCategories = ['Design', 'Content', 'Development', 'Hyperdrive'];

  if (!validCategories.includes(slug as string)) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug },
  };
}

export default ListingCategoryPage;
