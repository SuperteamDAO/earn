import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import type { Bounty } from '@/interface/bounty';
import Sidebar from '@/layouts/Sidebar';
import { userStore } from '@/store/user';

interface Props {
  slug: string;
}

function EditBounty({ slug }: Props) {
  const router = useRouter();
  const { userInfo } = userStore();
  const [isBountyLoading, setIsBountyLoading] = useState(true);
  console.log(
    'file: edit.tsx:18 ~ EditBounty ~ isBountyLoading:',
    isBountyLoading
  );
  const [bounty, setBounty] = useState<Bounty | null>(null);
  console.log('file: edit.tsx:20 ~ EditBounty ~ bounty:', bounty);

  const getBounty = async () => {
    setIsBountyLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/${slug}/`);
      setBounty(bountyDetails.data);
      if (bountyDetails.data.sponsorId !== userInfo?.currentSponsorId) {
        router.push('/dashboard/bounties');
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
      <div>Hello {slug}</div>
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
