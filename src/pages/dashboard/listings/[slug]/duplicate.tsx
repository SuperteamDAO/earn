import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import {
  ListingBuilder,
  type ListingFormData,
} from '@/features/listing-builder';
import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard';
import { useUser } from '@/store/user';

interface Props {
  slug: string;
}

export default function DuplicateBounty({ slug }: Props) {
  const router = useRouter();
  const { user } = useUser();

  const { data: listing, isLoading } = useQuery({
    ...sponsorDashboardListingQuery(slug),
    enabled: !!user?.currentSponsorId,
  });

  useEffect(() => {
    if (listing && listing.sponsorId !== user?.currentSponsorId) {
      router.push('/dashboard/listings');
    }
  }, [listing, user?.currentSponsorId, router]);

  return (
    <>
      {isLoading ? (
        <LoadingSection />
      ) : listing ? (
        <>
          <ListingBuilder
            listing={
              {
                ...listing,
                title: listing.title + ' (copy)',
                slug: '',
                isPublished: false,
                publishedAt: null,
                id: undefined,
              } as unknown as ListingFormData
            }
          />
        </>
      ) : (
        <div>Error loading bounty details.</div>
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};
