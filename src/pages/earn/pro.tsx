import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';

import ProIcon from '@/components/icons/ProIcon';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { cn } from '@/utils/cn';

import { userStatsQuery } from '@/features/home/queries/user-stats';
import { ListingsSection } from '@/features/listings/components/ListingsSection';
import { ProBanner } from '@/features/pro/components/ProBanner';
import { ProSidebar } from '@/features/pro/components/ProSidebar';

interface HomePageProps {
  readonly potentialSession: boolean;
}

export default function ProPage({ potentialSession }: HomePageProps) {
  const { data: stats } = useQuery(userStatsQuery);
  const customEmptySection = () => {
    return (
      <div className="flex w-full flex-col items-center justify-center py-16">
        <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-slate-100">
          <ProIcon className="size-8 text-slate-500" />
        </div>
        <h3 className="mb-1 text-lg leading-[1.2] font-semibold text-slate-700">
          More Pro listings are coming
        </h3>
        <p className="text-sm text-slate-500">
          Stay tuned for more Pro listings
        </p>
      </div>
    );
  };

  return (
    <Default
      className="bg-white"
      meta={
        <>
          <Meta
            title="Superteam Earn | Work to Earn in Crypto"
            description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
            canonical="https://earn.superteam.fun"
            og={ASSET_URL + `/og/pro.png`}
          />
        </>
      }
    >
      <div className={cn('mx-auto w-full px-2 lg:px-6')}>
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between p-0 lg:flex-row">
          <div className="w-full">
            <div className="w-full lg:pr-6">
              <div className="pt-3">
                <ProBanner totalEarnings={stats?.totalWinnings ?? 0} />
              </div>
              <div className="w-full">
                <ListingsSection
                  type="pro"
                  potentialSession={potentialSession}
                  customEmptySection={customEmptySection}
                />
              </div>
            </div>
          </div>
          <ProSidebar />
        </div>
      </div>
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
