import { useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { CreateListing } from '@/features/listing-builder';
import { sponsorDashboardListingQuery } from '@/features/sponsor-dashboard';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

interface Props {
  slug: string;
}

function EditBounty({ slug }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const [prevStep, setPrevStep] = useState<number>(2);

  const { data: bounty, isLoading } = useQuery(
    sponsorDashboardListingQuery(slug),
  );

  useEffect(() => {
    if (bounty) {
      if (bounty.sponsorId !== user?.currentSponsorId) {
        router.push('/dashboard/listings');
        return;
      }

      const isProject = bounty.type === 'project';

      const preview = router.query['preview'];
      if (!!preview) {
        if (isProject) setPrevStep(5);
        else setPrevStep(4);

        return;
      }

      if (
        bounty.isPublished ||
        !bounty.title ||
        !bounty.skills ||
        !bounty.pocSocials ||
        !bounty.deadline ||
        (isProject && !bounty.timeToComplete)
      ) {
        setPrevStep(2);
      } else if ((bounty.rewards || bounty.rewardAmount) && !isProject) {
        setPrevStep(4);
      } else if ((bounty.rewards || bounty.rewardAmount) && isProject) {
        setPrevStep(5);
      } else if (
        bounty.eligibility &&
        bounty.eligibility.length !== 0 &&
        isProject
      ) {
        setPrevStep(4);
      } else if (bounty.requirements || bounty.description) {
        setPrevStep(3);
      }
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
          prevStep={prevStep}
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

export default EditBounty;
