import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard/queries/listing';

interface Props {
  listing: string;
}

function EditBounty({ listing }: Props) {
  const { user } = useUser();
  const router = useRouter();

  const { data: bounty } = useQuery(sponsorDashboardListingQuery(listing));

  useEffect(() => {
    if (bounty && bounty.hackathonId !== user?.hackathonId) {
      router.push(`/dashboard/hackathon/`);
    }
  }, [bounty, user?.hackathonId, router]);

  return (
    <SponsorLayout>
      {/* <CreateListing listing={bounty} editable type={'hackathon'} /> */}
      <></>
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { listing } = context.query;
  return {
    props: { listing },
  };
};

export default EditBounty;
