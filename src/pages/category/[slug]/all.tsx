import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import type { NextPageContext } from 'next';
import { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import {
  type Bounty,
  ListingCard,
  ListingCardSkeleton,
  ListingSection,
} from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

interface Listings {
  bounties?: Bounty[];
}

type SlugKeys = 'design' | 'content' | 'development' | 'other';

function AllCategoryListingsPage({ slug }: { slug: string }) {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          filter: slug,
          take: 100,
        },
      });
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
    other: 'Superteam Earn | Other Bounties and Grants',
  };

  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || 'Superteam Earn'; // Default title if slug not found

  const metaDescription = `Find the latest ${slug.toLowerCase()} bounties and grants for freelancers and builders in the crypto space on Superteam Earn.`;
  const canonicalURL = `https://earn.superteam.fun/category/${slug}/all`;

  const formattedSlug =
    slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  return (
    <Home type="home">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
      />
      <Box w={'100%'}>
        <ListingSection
          type="bounties"
          title={`${formattedSlug} Gigs`}
          sub="Bite sized tasks for freelancers"
          emoji="/assets/home/emojis/moneyman.png"
        >
          {isListingsLoading &&
            Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          {!isListingsLoading && !listings?.bounties?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No listings available!"
                message="Subscribe to notifications to get notified about new listings."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            listings?.bounties?.map((bounty) => {
              return <ListingCard key={bounty.id} bounty={bounty} />;
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
        destination: `/category/${slug.toLowerCase()}/all`,
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

export default AllCategoryListingsPage;
