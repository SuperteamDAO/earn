import { type GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

import { FeatureModal } from '@/components/modals/FeatureModal';
import { Home } from '@/layouts/Home';
import { USER_ID_COOKIE_NAME } from '@/store/user';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { GrantsSection } from '@/features/grants/components/GrantsSection';
import { HackathonSection } from '@/features/hackathon/components/HackathonSection';
import { Listings } from '@/features/listings/components/Listings';

const InstallPWAModal = dynamic(
  () =>
    import('@/components/modals/InstallPWAModal').then(
      (mod) => mod.InstallPWAModal,
    ),
  { ssr: false },
);

interface HomePageProps {
  potentialSession: boolean;
}

export default function HomePage({ potentialSession }: HomePageProps) {
  return (
    <Home type="landing" potentialSession={potentialSession}>
      <InstallPWAModal />
      <HomepagePop />
      <FeatureModal />
      <div className="w-full">
        <Listings type="home" potentialSession={potentialSession} />
        <HackathonSection type="home" />
        <GrantsSection type="home" />
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
