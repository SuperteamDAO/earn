import type { GetServerSideProps } from 'next';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { JsonLd } from '@/components/shared/JsonLd';
import { GrantPageLayout } from '@/layouts/Grants';
import {
  generateBreadcrumbListSchema,
  generateMonetaryGrantSchema,
} from '@/utils/json-ld';

import { getGrantBySlug } from '@/features/grants/queries/get-grant-by-slug';
import { type GrantWithApplicationCount } from '@/features/grants/types';
import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';

interface InitialGrant {
  grant: GrantWithApplicationCount | null;
}

function Grants({ grant: initialGrant }: InitialGrant) {
  useEffect(() => {
    posthog.capture('open_grant');
  }, []);

  const monetaryGrantSchema = initialGrant
    ? generateMonetaryGrantSchema(initialGrant)
    : null;

  const breadcrumbSchema = initialGrant
    ? generateBreadcrumbListSchema([
        { name: 'Home', url: '/' },
        { name: 'Grants', url: '/earn/grants' },
        { name: initialGrant.title || 'Grant' },
      ])
    : null;

  return (
    <GrantPageLayout grant={initialGrant}>
      {monetaryGrantSchema && breadcrumbSchema && (
        <JsonLd data={[monetaryGrantSchema, breadcrumbSchema]} />
      )}
      <DescriptionUI
        description={(initialGrant?.description as string) ?? ''}
        sponsorId={initialGrant?.sponsorId ?? ''}
        isST={initialGrant?.isST}
      />
    </GrantPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { res } = context;
  const rawSlug = context.params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const grantData = await getGrantBySlug(slug);

    if (!grantData) {
      return {
        notFound: true,
      };
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    return {
      props: {
        grant: grantData,
      },
    };
  } catch (e) {
    console.error(e);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    return {
      props: {
        grant: null,
      },
    };
  }
};
export default Grants;
