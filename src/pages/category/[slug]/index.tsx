import { useQuery } from '@tanstack/react-query';
import type { NextPageContext } from 'next';
import { useMemo } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { Loading } from '@/components/shared/Loading';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { dayjs } from '@/utils/dayjs';

import { CategoryPop } from '@/features/conversion-popups/components/CategoryPop';
import { GrantsCard } from '@/features/grants/components/GrantsCard';
import { grantsQuery } from '@/features/grants/queries/grants';
import { ListingSection } from '@/features/listings/components/ListingSection';
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

  const { data: grants, isLoading: isGrantsLoading } = useQuery(
    grantsQuery({ order: 'asc', take: 10 }),
  );

  const titlesForSlugs: { [key in SlugKeys]: string } = {
    design: 'Design Bounties and Grants | Superteam Earn',
    content: 'Content Bounties and Grants | Superteam Earn',
    development: 'Development Bounties and Grants | Superteam Earn',
    other: 'Other Bounties and Grants | Superteam Earn',
  };

  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || 'Superteam Earn';
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
        og={ASSET_URL + `/og/categories/${slug}.png`}
      />
      <div className="w-full">
        {slug !== 'other' && <CategoryPop category={slug} />}
        <ListingTabs
          bounties={listingsData ?? []}
          isListingsLoading={isListingsLoading}
          showEmoji
          title={`${formattedSlug} Gigs`}
          viewAllLink={`/category/${slug}/all`}
          showViewAll
          take={10}
        />
        <ListingSection
          type="grants"
          title={`${formattedSlug} Grants`}
          sub="Equity-free funding opportunities for builders"
          showEmoji
          showViewAll
        >
          {isGrantsLoading && (
            <div className="flex min-h-52 flex-col items-center justify-center">
              <Loading />
            </div>
          )}
          {!isGrantsLoading && !grants?.length && (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </div>
          )}
          {!isGrantsLoading &&
            grants?.map((grant) => <GrantsCard grant={grant} key={grant.id} />)}
        </ListingSection>
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
