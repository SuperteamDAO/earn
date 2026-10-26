import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Home } from '@/layouts/Home';
import { JsonLdScripts } from '@/layouts/JsonLdScripts';
import { pageMetadata } from '@/lib/metadata';
import {
  generateBreadcrumbListSchema,
  generateCategoryCollectionSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { GrantsSection } from '@/features/grants/components/GrantsSection';
import { ListingsSection } from '@/features/listings/components/ListingsSection';
import { findCategoryBySlug } from '@/features/listings/utils/category';

type Props = PageProps<'/earn/category/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = findCategoryBySlug((await params).slug);
  if (!category) return {};
  const ogImage = new URL(`${getURL()}api/dynamic-og/category/`);
  ogImage.searchParams.set('category', category.name);
  const base = pageMetadata({
    title: `${category.name} Opportunities | Superteam Earn`,
    description: category.description,
    canonical: `https://superteam.fun/earn/category/${category.slug}/`,
    og: ogImage.toString(),
  });
  const alt = `${category.name} Opportunities on Superteam Earn`;
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [{ url: ogImage.toString(), width: 1200, height: 630, alt }],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = findCategoryBySlug((await params).slug);
  if (!category) notFound();

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: category.name },
  ]);
  const categoryCollectionSchema = generateCategoryCollectionSchema(
    category.name,
    category.slug,
    category.description,
  );
  const query = await searchParams;

  return (
    <Home
      type="category"
      categoryData={{ name: category.name, slug: category.slug }}
    >
      <JsonLdScripts data={[breadcrumbSchema, categoryCollectionSchema]} />
      <div className="w-full">
        <ListingsSection
          type="category"
          searchParams={query}
          category={category.name}
        />
        <GrantsSection
          hideWhenEmpty
          type="category"
          category={category.name}
          searchParams={query}
        />
      </div>
    </Home>
  );
}
