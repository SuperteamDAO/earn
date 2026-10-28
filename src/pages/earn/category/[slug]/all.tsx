import type { NextPageContext } from 'next';

import { Home } from '@/layouts/Home';
import {
  generateBreadcrumbListSchema,
  generateCategoryCollectionSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { CollectionPageMeta } from '@/features/listings/components/CollectionPageMeta';
import { ListingsSection } from '@/features/listings/components/ListingsSection';
import { findCategoryBySlug } from '@/features/listings/utils/category';

interface AllCategoryPageProps {
  readonly slug: string;
  readonly categoryName: string;
  readonly categoryDescription: string;
}

export default function AllCategoryPage({
  slug,
  categoryName,
  categoryDescription,
}: AllCategoryPageProps) {
  const ogImage = new URL(`${getURL()}api/dynamic-og/category/`);
  ogImage.searchParams.set('category', categoryName);

  const description = `Explore all ${categoryName.toLowerCase()} opportunities on Superteam Earn. ${categoryDescription}`;

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: categoryName },
  ]);

  const categoryCollectionSchema = generateCategoryCollectionSchema(
    categoryName,
    slug,
    description,
  );

  return (
    <Home
      type="category-all"
      categoryData={{
        name: categoryName,
        slug,
      }}
      meta={
        <CollectionPageMeta
          title={`All ${categoryName} Opportunities | Superteam Earn`}
          description={description}
          canonical={`https://superteam.fun/earn/category/${slug}/all/`}
          og={ogImage.toString()}
          ogImageAlt={`All ${categoryName} Opportunities on Superteam Earn`}
          jsonLd={[breadcrumbSchema, categoryCollectionSchema]}
        />
      }
    >
      <div className="w-full">
        <ListingsSection type="category-all" category={categoryName} />
      </div>
    </Home>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  const { slug } = context.query;
  const slugString = (slug as string)?.toLowerCase() || '';

  const categoryInfo = findCategoryBySlug(slugString);

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
}
