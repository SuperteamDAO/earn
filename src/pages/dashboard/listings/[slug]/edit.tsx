import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { CreateListing } from '@/components/listings/bounty/Bounty';
import { LoadingSection } from '@/components/shared/LoadingSection';
import type { Bounty } from '@/interface/bounty';
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

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      if (bountyDetails.data.sponsorId !== userInfo?.currentSponsorId) {
        router.push('/dashboard/listings');
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
          bounty={bounty}
          editable
          type={bounty?.type as 'permissioned' | 'open'}
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
