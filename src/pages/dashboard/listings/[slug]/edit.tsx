import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
// import { CreateListing } from '@/features/listing-builder';
import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { ListingBuilder } from '@/features/listing-builder';

interface Props {
  slug: string;
}

function EditBounty({ slug }: Props) {
  const router = useRouter();
  const { user } = useUser();

  const { data: listing, isLoading } = useQuery(
    sponsorDashboardListingQuery(slug),
  );

  useEffect(() => {
    console.log('listing', listing)
    if (listing) {
      if (listing.sponsorId !== user?.currentSponsorId) {
        router.push('/dashboard/listings');
        return;
      }
    }
  }, [listing, user?.currentSponsorId, router]);

  return (
    <>
      {isLoading ? (
        <LoadingSection />
      ) : listing ? (
          <>
            <ListingBuilder listing={listing} isEditing={!!listing.publishedAt} />
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
