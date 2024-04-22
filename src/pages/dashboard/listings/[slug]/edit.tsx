import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { CreateListing } from '@/features/listing-builder';
import type { Bounty } from '@/features/listings';
import { Sidebar } from '@/layouts/Sponsor';
import { userStore } from '@/store/user';

interface Props {
  slug: string;
}

function EditBounty({ slug }: Props) {
  const router = useRouter();
  const { userInfo } = userStore();
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  const [bounty, setBounty] = useState<Bounty | undefined>();
  const [prevStep, setPrevStep] = useState<number>(2);

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      if (bountyDetails.data.sponsorId !== userInfo?.currentSponsorId) {
        router.push('/dashboard/listings');
      } else {
        const bounty = bountyDetails.data as Bounty;
        const isProject = bounty?.type === 'project';
        if (
          bounty.isPublished ||
          !bounty.title ||
          !bounty.skills ||
          !bounty.pocSocials ||
          !bounty.applicationType ||
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

        setBounty(bountyDetails.data);
        setIsBountyLoading(false);
      }
    } catch (e) {
      setIsBountyLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getBounty();
    }
  }, [userInfo?.currentSponsorId]);

  return (
    <Sidebar>
      {isBountyLoading ? (
        <LoadingSection />
      ) : (
        <CreateListing
          listing={bounty}
          editable
          prevStep={prevStep}
          type={bounty?.type as 'bounty' | 'project' | 'hackathon'}
        />
      )}
    </Sidebar>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};

export default EditBounty;
