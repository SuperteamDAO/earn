import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import {
  ListingBuilder,
  type ListingFormData,
} from '@/features/listing-builder';
import {
  activeHackathonQuery,
  sponsorDashboardListingQuery,
} from '@/features/sponsor-dashboard';
import { useUser } from '@/store/user';

interface Props {
  slug: string;
}

function EditBounty({ slug }: Props) {
  const router = useRouter();
  const { user } = useUser();

  const { data: listing, isLoading } = useQuery({
    ...sponsorDashboardListingQuery(slug),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { data: hackathon, isLoading: hackathonLoading } = useQuery(
    activeHackathonQuery(),
  );

  useEffect(() => {
    console.log('listing', listing);
    if (listing) {
      if (listing.sponsorId !== user?.currentSponsorId) {
        router.push('/dashboard/listings');
        return;
      }
    }
  }, [listing, user?.currentSponsorId, router]);

  return (
    <>
      {isLoading || hackathonLoading ? (
        <LoadingSection />
      ) : listing ? (
        <>
          <ListingBuilder
            listing={listing as unknown as ListingFormData}
            isEditing={!!listing.publishedAt}
            hackathon={hackathon}
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

export default EditBounty;
