import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { CreateListing } from '@/features/listing-builder';
import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard'; // Adjust the import path as needed
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

interface Props {
  slug: string;
}

export default function DuplicateBounty({ slug }: Props) {
  const router = useRouter();
  const { user } = useUser();

  const { data: bounty, isLoading } = useQuery({
    ...sponsorDashboardListingQuery(slug),
    enabled: !!user?.currentSponsorId,
  });

  useEffect(() => {
    if (bounty && bounty.sponsorId !== user?.currentSponsorId) {
      router.push('/dashboard/listings');
    }
  }, [bounty, user?.currentSponsorId, router]);

  return (
    <SponsorLayout>
      {isLoading ? (
        <LoadingSection />
      ) : bounty ? (
        <CreateListing
          listing={bounty}
          editable
          isDuplicating
          type={bounty.type as 'bounty' | 'project' | 'hackathon'}
        />
      ) : (
        <div>Error loading bounty details.</div>
      )}
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};
