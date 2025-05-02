import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';
import { useMemo } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { PROJECT_NAME } from '@/constants/project';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { dayjs } from '@/utils/dayjs';
import { getURL } from '@/utils/validUrl';

import { CategoryPop } from '@/features/conversion-popups/components/CategoryPop';
import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { listingsQuery } from '@/features/listings/queries/listings';

type SlugKeys = 'design' | 'content' | 'development' | 'other';

function ListingCategoryPage({ slug }: { slug: SlugKeys }) {
  const deadline = useMemo(
    () => dayjs().subtract(1, 'month').toISOString(),
    [],
  );

  const { data: listingsData, isLoading: isListingsLoading } = useQuery(
    listingsQuery({
      take: 100,
      filter: slug,
      deadline,
    }),
  );

  const { data: sponsorships, isLoading: isSponsorshipsLoading } = useQuery(
    listingsQuery({
      type: 'sponsorship',
      take: 10,
      filter: slug,
      deadline,
    }),
  );

  const titlesForSlugs: { [key in SlugKeys]: string } = {
    design: `Design Bounties and Sponsorships | ${PROJECT_NAME}`,
    content: `Content Bounties and Sponsorships | ${PROJECT_NAME}`,
    development: `Development Bounties and Sponsorships | ${PROJECT_NAME}`,
    other: `Other Bounties and Sponsorships | ${PROJECT_NAME}`,
  };

  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || `${PROJECT_NAME}`;
  const formattedSlug =
    slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  const metaDescription = `Find the latest ${slug.toLowerCase()} projects and sponsorships for professionals on ${PROJECT_NAME}.`;
  const canonicalURL = `${getURL()}/category/${slug}/`;

  return (
    <Home type="category">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
        og={ASSET_URL + `/og/categories/${slug}.png`}
      />
      <div className="w-full">
        {slug !== 'other' && <CategoryPop category={slug} />}
        <ListingTabs
          bounties={listingsData ?? []}
          isListingsLoading={isListingsLoading}
          title={`${formattedSlug} Opportunities`}
          viewAllLink={`/category/${slug}/all`}
          showViewAll
          take={10}
        />

        <ListingTabs
          bounties={sponsorships ?? []}
          isListingsLoading={isSponsorshipsLoading}
          title={`${formattedSlug} Sponsorships`}
          viewAllLink={`/category/${slug}/all`}
          take={10}
          showViewAll
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
