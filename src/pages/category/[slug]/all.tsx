import { Box } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';
import { useRouter } from 'next/router';

import { listingsQuery, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

type SlugKeys = 'design' | 'content' | 'development' | 'other';

function AllCategoryListingsPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      filter: slug,
      take: 100,
    }),
  );

  const titlesForSlugs: { [key in SlugKeys]: string } = {
    design: 'Design Bounties and Grants | Solar Earn',
    content: 'Content Bounties and Grants | Solar Earn',
    development: 'Development Bounties and Grants | Solar Earn',
    other: 'Other Bounties and Grants | Solar Earn',
  };
  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || 'Solar Earn';
  const metaDescription = `Find the latest ${slug.toLowerCase()} bounties and grants for freelancers and builders in the crypto space on Solar Earn.`;
  const canonicalURL = `https://earn.superteam.fun/category/${slug}/all`;

  return (
    <Home type="category">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
        og={`${router.basePath}/assets/og/categories/${slug}.png`}
      />
      <Box w={'100%'}>
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          emoji="/assets/home/emojis/moneyman.webp"
          title="Freelance Gigs"
          viewAllLink="/all"
        />
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
