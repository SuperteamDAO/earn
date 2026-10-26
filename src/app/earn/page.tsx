import * as Effect from 'effect/Effect';

import { Default } from '@/layouts/Default';
import { homeCounts } from '@/layouts/home-counts';
import { JsonLdScripts } from '@/layouts/JsonLdScripts';
import { pageMetadata } from '@/lib/metadata';
import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorStages from '@/server/sponsor-stage';
import { cn } from '@/utils/cn';
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/utils/json-ld';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { GrantsSection } from '@/features/grants/components/GrantsSection';
import { BannerCarousel } from '@/features/home/components/Banner';
import { HomeSideBar } from '@/features/home/components/SideBar';
import { SponsorStageBanner } from '@/features/home/components/SponsorStage/SponsorStageBanner';
import { SponsorStageSnackbar } from '@/features/home/components/SponsorStage/SponsorStageSnackbar';
import { UserStatsBanner } from '@/features/home/components/UserStatsBanner';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

export const metadata = pageMetadata({
  title:
    'Superteam Earn | Crypto Bounties, Web3 Jobs & Solana Opportunities | Work to Earn in Crypto',
  description:
    'Find crypto bounties, web3 jobs, and Solana opportunities. Earn crypto by completing bounties in design, development, and content. The leading platform for remote crypto work.',
  canonical: 'https://superteam.fun/earn/',
});

export default async function HomePage({ searchParams }: PageProps<'/earn'>) {
  const viewer = await getViewer();
  const isSponsorView = !!viewer?.currentSponsorId;
  const [counts, stage, params] = await Promise.all([
    homeCounts(),
    viewer?.currentSponsorId
      ? runtime.runPromise(
          SponsorStages.SponsorStages.use((stages) =>
            stages.stage(viewer.currentSponsorId ?? ''),
          ).pipe(
            Effect.map((data) => data.stage),
            Effect.orElseSucceed(() => null),
          ),
        )
      : null,
    searchParams,
  ]);
  const showAddListingCard =
    stage === SponsorStages.SponsorStage.NEW_SPONSOR ||
    stage === SponsorStages.SponsorStage.NEXT_LISTING;

  return (
    <Default
      className="bg-white"
      headerSnackbar={isSponsorView ? <SponsorStageSnackbar /> : undefined}
    >
      <JsonLdScripts
        data={[generateOrganizationSchema(), generateWebSiteSchema()]}
      />
      <div className={cn('mx-auto w-full px-2 lg:px-6')}>
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="w-full lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                <div className="pt-3">
                  {viewer ? (
                    isSponsorView ? (
                      <>
                        <div className="mt-3 hidden lg:block">
                          <SponsorStageBanner />
                        </div>
                        <div className="lg:hidden">
                          <UserStatsBanner />
                        </div>
                      </>
                    ) : (
                      <UserStatsBanner />
                    )
                  ) : (
                    <BannerCarousel
                      totalUsers={counts?.totalUsers}
                      totalSponsors={counts?.totalSponsors}
                    />
                  )}
                </div>
                <div className="w-full">
                  <ListingsSection
                    type="home"
                    searchParams={params}
                    showAddListingCard={showAddListingCard}
                  />
                  <GrantsSection type="home" searchParams={params} />
                </div>
              </div>
            </div>
            <div className="hidden lg:flex">
              <HomeSideBar type="landing" isHomepage />
            </div>
          </div>
        </div>
      </div>
      <HomepagePop />
    </Default>
  );
}
