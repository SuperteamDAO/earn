import { notFound } from 'next/navigation';

import { GrantPageLayout } from '@/layouts/Grants';
import {
  generateBreadcrumbListSchema,
  generateMonetaryGrantSchema,
} from '@/utils/json-ld';

import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { getDescriptionHtml } from '@/features/listings/utils/description-html';

import { grantBySlug, grantMetadata, grantPageData } from './grant-data';
import { OpenGrantEvent } from './open-grant-event';

import styles from '@/styles/listing-description.module.css';

export async function generateMetadata({
  params,
}: PageProps<'/earn/grants/[slug]'>) {
  const { slug } = await params;
  const grant = await grantBySlug(slug);
  return grantMetadata(grant ?? null);
}

export default async function GrantPage({
  params,
}: PageProps<'/earn/grants/[slug]'>) {
  const { slug } = await params;
  const grant = await grantBySlug(slug);
  if (grant === undefined) notFound();
  const data = await grantPageData(grant);

  const jsonLd = grant
    ? [
        generateMonetaryGrantSchema(grant),
        generateBreadcrumbListSchema([
          { name: 'Home', url: '/' },
          { name: 'Grants', url: '/earn/grants' },
          { name: grant.title || 'Grant' },
        ]),
      ]
    : [];

  return (
    <>
      <OpenGrantEvent />
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          // oxlint-disable-next-line react/no-danger -- structured data, escaped
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
          }}
        />
      ))}
      <GrantPageLayout grant={grant} data={data}>
        <DescriptionUI
          html={getDescriptionHtml(
            grant?.description ?? '',
            styles.descriptionH1 ?? '',
          )}
          sponsorId={grant?.sponsorId ?? ''}
          isST={grant?.isST}
        />
      </GrantPageLayout>
    </>
  );
}
