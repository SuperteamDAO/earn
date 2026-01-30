import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

import { JsonLd } from '@/components/shared/JsonLd';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/utils/json-ld';

import { ProListingsAnnouncement } from '@/features/announcements/components/ProListingsAnnouncement';
import { BannerCarousel } from '@/features/home/components/Banner';
import { SponsorStageBanner } from '@/features/home/components/SponsorStage/SponsorStageBanner';
import { UserStatsBanner } from '@/features/home/components/UserStatsBanner';
import { userCountQuery } from '@/features/home/queries/user-count';
import { ListingsSection } from '@/features/listings/components/ListingsSection';
import { ProIntroDialog } from '@/features/pro/components/ProIntroDialog';

const GrantsSection = dynamic(() =>
  import('@/features/grants/components/GrantsSection').then(
    (mod) => mod.GrantsSection,
  ),
);

const HomeSideBar = dynamic(() =>
  import('@/features/home/components/SideBar').then((mod) => mod.HomeSideBar),
);

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

interface HomePageProps {
  readonly potentialSession: boolean;
}

export default function HomePage({ potentialSession }: HomePageProps) {
  const { authenticated } = usePrivy();
  const { data: totalUsers } = useQuery(userCountQuery);
  const { user } = useUser();
  const isLg = useBreakpoint('lg');

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <Default
      className="bg-white"
      meta={
        <>
          <Meta
            title="Superteam Earn | Crypto Bounties, Web3 Jobs & Solana Opportunities | Work to Earn in Crypto"
            description="Find crypto bounties, web3 jobs, and Solana opportunities. Earn crypto by completing bounties in design, development, and content. The leading platform for remote crypto work."
            canonical="https://superteam.fun/earn"
          />
          <JsonLd data={[organizationSchema, websiteSchema]} />
        </>
      }
    >
      <div className={cn('mx-auto w-full px-2 lg:px-6')}>
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="w-full lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                <div className="pt-3">
                  {potentialSession || authenticated ? (
                    <>
                      {!!user?.currentSponsorId && isLg ? (
                        <div className="mt-3">
                          <SponsorStageBanner />
                        </div>
                      ) : (
                        <UserStatsBanner />
                      )}
                    </>
                  ) : (
                    <BannerCarousel totalUsers={totalUsers?.totalUsers} />
                  )}
                </div>
                <div className="w-full">
                  <ListingsSection
                    type="home"
                    potentialSession={potentialSession}
                  />
                  {/* <HackathonSection type="home" /> */}
                  <GrantsSection type="home" />
                </div>
              </div>
            </div>
            {isLg && (
              <div className="flex">
                <HomeSideBar type="landing" />
              </div>
            )}
          </div>
        </div>
      </div>
      <InstallPWAModal />
      <HomepagePop />
      <TalentAnnouncements />
      <ProListingsAnnouncement />
      {authenticated && <ProIntroDialog />}
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({
  req,
}) => {
  const cookies = req.headers.cookie || '';

  const cookieExists = /(^|;)\s*user-id-hint=/.test(cookies);

  return { props: { potentialSession: cookieExists } };
};
