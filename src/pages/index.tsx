import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

import { FeatureModal } from '@/components/modals/FeatureModal';
import { Home } from '@/layouts/Home';
import { USER_ID_COOKIE_NAME } from '@/store/user';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { homepageGrantsQuery } from '@/features/home/queries/grants';
import { ListingSection } from '@/features/listings/components/ListingSection';
import { ListingTabs } from '@/features/listings/components/ListingTabs';

const InstallPWAModal = dynamic(
  () =>
    import('@/components/modals/InstallPWAModal').then(
      (mod) => mod.InstallPWAModal,
    ),
  { ssr: false },
);

const GrantsCard = dynamic(
  () =>
    import('@/features/grants/components/GrantsCard').then(
      (mod) => mod.GrantsCard,
    ),
  { ssr: false },
);

const EmptySection = dynamic(
  () =>
    import('@/components/shared/EmptySection').then((mod) => mod.EmptySection),
  { ssr: false },
);

interface HomePageProps {
  potentialSession: boolean;
}

export default function HomePage({ potentialSession }: HomePageProps) {
  const { data: grants } = useQuery(homepageGrantsQuery);

  return (
    <Home type="landing" potentialSession={potentialSession}>
      <InstallPWAModal />
      <HomepagePop />
      <FeatureModal />
      <div className="w-full">
        <ListingTabs type="home" potentialSession={potentialSession} />
        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          showEmoji
          showViewAll
        >
          {!grants?.length && (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection title="No grants available!" />
            </div>
          )}
          {grants &&
            grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection>
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
