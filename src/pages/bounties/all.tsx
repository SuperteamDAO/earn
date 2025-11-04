import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const BountiesPage: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/all/?tab=bounties');
  }, [router]);

  return null;
};

export default BountiesPage;
