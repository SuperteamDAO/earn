import { notFound } from 'next/navigation';

import { GrantPageLayout } from '@/layouts/Grants';

import { ReferenceCard } from '@/features/listings/components/ListingPage/ReferenceCard';

import { grantBySlug, grantMetadata, grantPageData } from '../grant-data';

export async function generateMetadata({
  params,
}: PageProps<'/earn/grants/[slug]/references'>) {
  const { slug } = await params;
  const grant = await grantBySlug(slug);
  return grantMetadata(grant ?? null);
}

export default async function GrantReferencesPage({
  params,
}: PageProps<'/earn/grants/[slug]/references'>) {
  const { slug } = await params;
  const grant = await grantBySlug(slug);
  if (grant === undefined) notFound();
  const data = await grantPageData(grant);

  return (
    <GrantPageLayout grant={grant} data={data}>
      <div>
        <div className="mt-2 mb-10 flex max-w-7xl flex-col gap-4 rounded-lg bg-white md:flex-row md:items-start md:justify-between">
          <div className="w-full">
            <p className="mt-2 mb-6 text-xl font-semibold text-gray-500">
              References
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {grant?.references?.map((reference, i) => (
                <ReferenceCard
                  link={reference.link}
                  key={i}
                  title={reference.title}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </GrantPageLayout>
  );
}
