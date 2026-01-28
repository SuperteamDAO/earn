import type { GetServerSideProps } from 'next';
import posthog from 'posthog-js';
import { useEffect } from 'react';

import { JsonLd } from '@/components/shared/JsonLd';
import { GrantPageLayout } from '@/layouts/Grants';
import { api } from '@/lib/api';
import {
  generateBreadcrumbListSchema,
  generateMonetaryGrantSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { GrantsPop } from '@/features/conversion-popups/components/GrantsPop';
import { type GrantWithApplicationCount } from '@/features/grants/types';
import { isTouchingGrassGrant } from '@/features/grants/utils/touchingGrass';
import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';

interface InitialGrant {
  grant: GrantWithApplicationCount;
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
      <GrantsPop />
      <DescriptionUI
        description={(initialGrant?.description as string) ?? ''}
        isPro={initialGrant?.isPro}
        type="grant"
        sponsorId={initialGrant?.sponsorId ?? ''}
        isTouchingGrass={isTouchingGrassGrant(initialGrant)}
      />
    </GrantPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let grantData;
  try {
    const grantDetails = await api.get(`${getURL()}api/grants/${slug}`);
    grantData = grantDetails.data;
  } catch (e) {
    console.error(e);
    grantData = null;
  }

  return {
    props: {
      grant: grantData,
    },
  };
};
export default Grants;
