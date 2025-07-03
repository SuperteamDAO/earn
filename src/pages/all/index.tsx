import { type GetServerSideProps } from 'next';

import { Home } from '@/layouts/Home';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

interface HomePageProps {
  potentialSession: boolean;
}

export default function AllListingsPage({ potentialSession }: HomePageProps) {
  return (
    <Home type="listing">
      <HomepagePop />
      <div className="w-full">
        <ListingsSection type="all" potentialSession={potentialSession} />
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
