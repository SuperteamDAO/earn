import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import type { NextPageContext } from 'next';
import { useEffect, useState } from 'react';

import { BountyTabs } from '@/components/listings/bounty/Tabs';
import { GrantsCard, ListingSection } from '@/components/misc/listingsCard';
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

type SlugKeys = 'design' | 'content' | 'development';

function ListingCategoryPage({ slug }: { slug: string }) {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
    grants: [],
  });

  const deadline = dayjs().subtract(1, 'month').toISOString();

  const getListings = async () => {
    setIsListingsLoading(true);
    const params = { category: 'all', take: 100, filter: slug, deadline };
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
    design: 'Superteam Earn | Design Bounties and Grants',
    content: 'Superteam Earn | Content Bounties and Grants',
    development: 'Superteam Earn | Development Bounties and Grants',
    // Hyperdrive: 'Superteam Earn | Apply to Hyperdrive global Solana Hackathon',
  };

  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || 'Superteam Earn'; // Default title if slug not found
  const formattedSlug =
    slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  // slug === 'Hyperdrive' ? slug.toUpperCase() : slug.toLowerCase();
  const metaDescription = `Find the latest ${slug.toLowerCase()} bounties and grants for freelancers and builders in the crypto space on Superteam Earn.`;
  const canonicalURL = `https://earn.superteam.fun/all/${slug}/`;

  return (
    <Home type="category">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
      />
      <Box w={'100%'}>
        <BountyTabs
          bounties={listings.bounties}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title={`${formattedSlug} Gigs`}
        />
        <ListingSection
          type="grants"
          title={`${formattedSlug} Grants`}
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
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

  if (slug && typeof slug === 'string' && slug !== slug.toLowerCase()) {
    return {
      redirect: {
        destination: `/all/${slug.toLowerCase()}`,
        permanent: false,
      },
    };
  }

  const normalizedSlug = typeof slug === 'string' ? slug.toLowerCase() : '';
  const validCategories = ['design', 'content', 'development'];

  if (!validCategories.includes(normalizedSlug)) {
    return {
      notFound: true,
    };
  }

  return {
    props: { slug },
  };
}

export default ListingCategoryPage;
