import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import type { NextPageContext } from 'next';
import { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { type Grant, GrantsCard } from '@/features/grants';
import { type Bounty, ListingSection, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

type SlugKeys = 'design' | 'content' | 'development' | 'other';

function ListingCategoryPage({ slug }: { slug: string }) {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<{ bounties: Bounty[] }>({
    bounties: [],
  });
  const [grants, setGrants] = useState<{ grants: Grant[] }>({
    grants: [],
  });

  const deadline = dayjs().subtract(1, 'month').toISOString();

  const getListings = async () => {
    setIsListingsLoading(true);
    const params = { category: 'bounties', take: 100, filter: slug, deadline };
    try {
      const listingData = await axios.get('/api/listings/', { params });
      setListings(listingData.data);
      setIsListingsLoading(false);

      const grantsData = await axios.get('/api/listings/', {
        params: {
          category: 'grants',
        },
      });
      setGrants(grantsData.data);
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
    other: 'Superteam Earn | Other Bounties and Grants',
  };

  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || 'Superteam Earn'; // Default title if slug not found
  const formattedSlug =
    slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  const metaDescription = `Find the latest ${slug.toLowerCase()} bounties and grants for freelancers and builders in the crypto space on Superteam Earn.`;
  const canonicalURL = `https://earn.superteam.fun/category/${slug}/`;

  return (
    <Home type="category">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
      />
      <Box w={'100%'}>
        <ListingTabs
          bounties={listings.bounties}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title={`${formattedSlug} Gigs`}
          viewAllLink={`/category/${slug}/all`}
          showViewAll
          take={10}
        />
        <ListingSection
          type="grants"
          title={`${formattedSlug} Grants`}
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
          showViewAll
        >
          {isListingsLoading && (
            <Flex align="center" justify="center" direction="column" minH={52}>
              <Loading />
            </Flex>
          )}
          {!isListingsLoading && !grants?.grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            grants?.grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
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
        destination: `/category/${slug.toLowerCase()}`,
        permanent: false,
      },
    };
  }

  const normalizedSlug = typeof slug === 'string' ? slug.toLowerCase() : '';
  const validCategories = ['design', 'content', 'development', 'other'];

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
