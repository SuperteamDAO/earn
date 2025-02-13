import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { PROJECT_NAME } from '@/constants/project';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { getURL } from '@/utils/validUrl';

import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { listingsQuery } from '@/features/listings/queries/listings';

type SlugKeys = 'design' | 'content' | 'development' | 'other';

function AllCategoryListingsPage({ slug }: { slug: string }) {
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      filter: slug,
      take: 100,
    }),
  );

  const titlesForSlugs: { [key in SlugKeys]: string } = {
    design: `Design Bounties and Grants | ${PROJECT_NAME}`,
    content: `Content Bounties and Grants | ${PROJECT_NAME}`,
    development: `Development Bounties and Grants | ${PROJECT_NAME}`,
    other: `Other Bounties and Grants | ${PROJECT_NAME}`,
  };
  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || `${PROJECT_NAME}`;
  const metaDescription = `Find the latest ${slug.toLowerCase()} bounties and grants for freelancers and builders in the crypto space on ${PROJECT_NAME}.`;
  const canonicalURL = `${getURL()}/category/${slug}/all`;

  return (
    <Home type="category">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
        og={ASSET_URL + `/og/categories/${slug}.png`}
      />
      <div className="w-full">
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          showEmoji
          title="Freelance Gigs"
          viewAllLink="/all"
        />
      </div>
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
