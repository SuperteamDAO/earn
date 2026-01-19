import { type GetServerSideProps } from 'next';
import Head from 'next/head';

import { JsonLd } from '@/components/shared/JsonLd';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import {
  generateBreadcrumbListSchema,
  generateCategoryCollectionSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { GrantsSection } from '@/features/grants/components/GrantsSection';
import { ListingsSection } from '@/features/listings/components/ListingsSection';
import { findCategoryBySlug } from '@/features/listings/utils/category';

interface CategoryPageProps {
  readonly slug: string;
  readonly categoryName: string;
  readonly categoryDescription: string;
}

const CategoryPage = ({
  slug,
  categoryName,
  categoryDescription,
}: CategoryPageProps) => {
  const ogImage = new URL(`${getURL()}api/dynamic-og/category/`);
  ogImage.searchParams.set('category', categoryName);

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: categoryName },
  ]);

  const categoryCollectionSchema = generateCategoryCollectionSchema(
    categoryName,
    slug,
    categoryDescription,
  );

  return (
    <Home
      type="category"
      categoryData={{
        name: categoryName,
        slug,
      }}
      meta={
        <>
          <Meta
            title={`${categoryName} Opportunities | Superteam Earn`}
            description={categoryDescription}
            canonical={`https://superteam.fun/earn/category/${slug}/`}
            og={ogImage.toString()}
          />
          <Head>
            <meta property="og:type" content="website" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta
              property="og:image:alt"
              content={`${categoryName} Opportunities on Superteam Earn`}
            />
            <meta name="twitter:card" content="summary_large_image" />
          </Head>
          <JsonLd data={[breadcrumbSchema, categoryCollectionSchema]} />
        </>
      }
    >
      <div className="w-full">
        <ListingsSection type="category" category={categoryName} />
        <GrantsSection hideWhenEmpty type="category" category={categoryName} />
      </div>
    </Home>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const slug = params?.slug;

  if (typeof slug !== 'string') {
    return {
      notFound: true,
    };
  }

  const categoryInfo = findCategoryBySlug(slug);

  if (!categoryInfo) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      slug: categoryInfo.slug,
      categoryName: categoryInfo.name,
      categoryDescription: categoryInfo.description,
    },
  };
};

export default CategoryPage;
