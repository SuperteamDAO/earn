import { type GetServerSideProps } from 'next';

import { Home } from '@/layouts/Home';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { Listings } from '@/features/listings/components/Listings';

interface HomePageProps {
  potentialSession: boolean;
}

export default function AllListingsPage({ potentialSession }: HomePageProps) {
  return (
    <Home type="listing">
      <HomepagePop />
      <div className="w-full">
        <Listings type="all" potentialSession={potentialSession} />
      </div>
    </Home>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({
  req,
}) => {
  const cookies = req.headers.cookie || '';

  const cookieExists = /(^|;)\s*user-id-hint=/.test(cookies);

  return { props: { potentialSession: cookieExists } };
};
