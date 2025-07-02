import { type GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

import { Home } from '@/layouts/Home';
import { USER_ID_COOKIE_NAME } from '@/store/user';

import { Listings } from '@/features/listings/components/Listings';

const InstallPWAModal = dynamic(
  () =>
    import('@/components/modals/InstallPWAModal').then(
      (mod) => mod.InstallPWAModal,
    ),
  { ssr: false },
);

const HomepagePop = dynamic(
  () =>
    import('@/features/conversion-popups/components/HomepagePop').then(
      (mod) => mod.HomepagePop,
    ),
  { ssr: false },
);

const TalentAnnouncements = dynamic(
  () =>
    import('@/features/announcements/components/TalentAnnouncements').then(
      (mod) => mod.TalentAnnouncements,
    ),
  { ssr: false },
);

const GrantsSection = dynamic(
  () =>
    import('@/features/grants/components/GrantsSection').then(
      (mod) => mod.GrantsSection,
    ),
  { ssr: false },
);

interface HomePageProps {
  readonly potentialSession: boolean;
  readonly totalUsers: number | null;
}

export default function HomePage({
  potentialSession,
  totalUsers,
}: HomePageProps) {
  return (
    <Home
      type="landing"
      potentialSession={potentialSession}
      totalUsers={totalUsers}
    >
      <InstallPWAModal />
      <HomepagePop />
      <TalentAnnouncements />
      <div className="w-full">
        <Listings type="home" potentialSession={potentialSession} />
        {/* <HackathonSection type="home" /> */}
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

  try {
    const res = await fetch(
      'https://earn.superteam.fun/api/homepage/user-count',
    );

    const data = await res.json();
    const totalUsers = data.totalUsers;

    return { props: { potentialSession: cookieExists, totalUsers } };
  } catch (e) {
    return { props: { potentialSession: cookieExists, totalUsers: null } };
  }
};
