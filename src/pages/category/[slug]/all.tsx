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
    design: 'Design Bounties and Grants | Superteam Earn',
    content: 'Content Bounties and Grants | Superteam Earn',
    development: 'Development Bounties and Grants | Superteam Earn',
    other: 'Other Bounties and Grants | Superteam Earn',
  };
  const titleKey = slug as SlugKeys;
  const title = titlesForSlugs[titleKey] || 'Superteam Earn';
  const metaDescription = `Find the latest ${slug.toLowerCase()} bounties and grants for freelancers and builders in the crypto space on Superteam Earn.`;
  const canonicalURL = `https://earn.superteam.fun/category/${slug}/all`;

  return (
    <Home type="category">
      <Meta
        title={title}
        description={metaDescription}
        canonical={canonicalURL}
        og={`${router.basePath}/assets/og/categories/${slug}.png`}
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
