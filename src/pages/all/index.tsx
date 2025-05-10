import { type GetServerSideProps } from 'next';

import { Home } from '@/layouts/Home';
import { USER_ID_COOKIE_NAME } from '@/store/user';

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

  const cookieExists = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${USER_ID_COOKIE_NAME}=`));

  return {
    props: {
      potentialSession: cookieExists,
    },
  };
};
