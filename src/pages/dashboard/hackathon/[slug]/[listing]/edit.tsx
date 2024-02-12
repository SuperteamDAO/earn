import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { CreateListing } from '@/features/listing-builder';
import type { Bounty } from '@/interface/bounty';
import { Sidebar } from '@/layouts/Sponsor';
import { userStore } from '@/store/user';

interface Props {
  slug: string;
  listing: string;
}

function EditBounty({ slug, listing }: Props) {
  const router = useRouter();
  const { userInfo } = userStore();
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  const [bounty, setBounty] = useState<Bounty | undefined>();

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${listing}/`);
      if (bountyDetails.data.hackathonId !== userInfo?.hackathonId) {
        router.push(`/dashboard/hackathon/${slug}`);
      } else {
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
          hackathonSlug={slug}
          bounty={bounty}
          editable
          type={'hackathon'}
        />
      )}
    </Sidebar>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, listing } = context.query;
  return {
    props: { slug, listing },
  };
};

export default EditBounty;
