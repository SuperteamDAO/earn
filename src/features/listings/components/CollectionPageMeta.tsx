import Head from 'next/head';

import { JsonLd } from '@/components/shared/JsonLd';
import { Meta } from '@/layouts/Meta';

interface CollectionPageMetaProps {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly og: string;
  readonly ogImageAlt: string;
  readonly jsonLd: object[];
}

export function CollectionPageMeta({
  title,
  description,
  canonical,
  og,
  ogImageAlt,
  jsonLd,
}: CollectionPageMetaProps) {
  return (
    <>
      <Meta
        title={title}
        description={description}
        canonical={canonical}
        og={og}
      />
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={ogImageAlt} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <JsonLd data={jsonLd} />
    </>
  );
}
