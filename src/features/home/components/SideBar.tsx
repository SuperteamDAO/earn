import 'server-only';

import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';

import { getViewer } from '@/lib/session';
import * as HomeStats from '@/server/home-stats';
import * as LiveLists from '@/server/live-lists';
import { runtime } from '@/server/runtime';
import * as SponsorStages from '@/server/sponsor-stage';

import { randomFallbackImage } from '../utils/fallback-image';
import { HowItWorks } from './HowItWorks';
import { LiveListings } from './LiveListings';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SidebarBanner } from './SidebarBanner';
import { SectionHeader } from './SidebarSectionHeader';
import { SponsorBanner } from './SponsorBanner';
import { SponsorFeatures } from './SponsorFeatures';
import { SponsorResources } from './SponsorResources';
import { SponsorListing } from './SponsorStage/SponsorSidebarListing';
import { SponsorWelcomeVideo } from './SponsorStage/SponsorWelcomeVideo';
import { TotalStats } from './TotalStats';
import { VibeCard } from './VibeCard';
import { YourBookmarks } from './YourBookmarks';

interface SideBarProps {
  readonly type: 'landing' | 'listing' | 'category' | 'region' | 'feed';
  // On /earn/ itself: signed out (or without a profile), the sponsor banner
  // shows.
  readonly isHomepage?: boolean;
  // On /earn/bookmarks/: no bookmarks section.
  readonly hideBookmarks?: boolean;
}

// A failed widget leaves its section empty rather than failing the page.
const load = <A, E, R>(effect: Effect.Effect<A, E, R>, fallback: A) =>
  effect.pipe(Effect.orElseSucceed(() => fallback));

// One fallback picture per activity row, picked here so the browser
// renders the same ones.
const fallbackImages = (count: number) =>
  Array.from({ length: count }, () => randomFallbackImage(Math.random()));

// Earn's home sidebar (lg screens only, by its parents): for sponsors their
// welcome, latest listing and resources; for everyone else stats, how it
// works, bookmarks, recent earners and activity; on the feed, the vibe card
// and live listings.
export async function HomeSideBar({
  type,
  isHomepage = false,
  hideBookmarks = false,
}: SideBarProps) {
  const user = await getViewer();
  const isFeed = type === 'feed';
  const isSponsor = !!user?.currentSponsorId;
  const sponsorId = user?.currentSponsorId ?? null;

  const data = await runtime.runPromise(
    Effect.all(
      {
        now: Clock.currentTimeMillis,
        recentEarners: load(
          HomeStats.HomeStats.use((stats) => stats.recentEarners),
          [],
        ),
        totals: load(
          HomeStats.HomeStats.use((stats) => stats.totals),
          undefined,
        ),
        userCount: load(
          HomeStats.HomeStats.use((stats) => stats.userCount),
          { totalUsers: 0 },
        ),
        userStats: user
          ? load(
              HomeStats.HomeStats.use((stats) => stats.userStats(user.id)),
              null,
            )
          : Effect.succeed(null),
        bookmarks: user
          ? load(
              LiveLists.LiveLists.use((lists) => lists.bookmarks(user.id, 5)),
              [],
            )
          : Effect.succeed([]),
        activity: load(
          HomeStats.HomeStats.use((stats) => stats.recentActivity),
          [],
        ),
        stage:
          sponsorId && !isFeed
            ? load(
                SponsorStages.SponsorStages.use((stages) =>
                  stages.stage(sponsorId),
                ),
                null,
              )
            : Effect.succeed(null),
        live: isFeed
          ? Clock.currentTimeMillis.pipe(
              Effect.flatMap((now) =>
                load(
                  LiveLists.LiveLists.use((lists) =>
                    lists.listings(
                      {
                        take: 5,
                        deadline: new Date(now + 24 * 60 * 60 * 1000),
                        type: 'bounty',
                        excludeIds: [],
                        exclusiveSponsorId: null,
                      },
                      user?.location ?? null,
                    ),
                  ),
                  [],
                ),
              ),
            )
          : Effect.succeed([]),
      },
      { concurrency: 'unbounded' },
    ),
  );

  const showSponsorBanner =
    isHomepage && (!user || (!user.isTalentFilled && !user.currentSponsorId));

  const renderContent = () => {
    if (isFeed) {
      return (
        <>
          <VibeCard />
          <SidebarBanner />
          <LiveListings listings={data.live} now={data.now}>
            <SectionHeader title="LIVE LISTINGS" href="/earn/" />
          </LiveListings>
          <HowItWorks stats={data.userStats} />
          <RecentEarners earners={data.recentEarners} />
        </>
      );
    }

    if (isSponsor) {
      return (
        <div className="flex flex-col gap-4">
          <div className="mt-2 flex flex-col gap-8">
            <SponsorWelcomeVideo stage={data.stage?.stage ?? null} />
            <SponsorListing data={data.stage} />
            <SponsorResources />
            <SponsorFeatures />
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col gap-4">
          {showSponsorBanner && (
            <SponsorBanner totalUsers={data.userCount.totalUsers} />
          )}
          <TotalStats
            isTotalLoading={false}
            bountyCount={data.totals?.count}
            TVE={data.totals?.totalInUSD}
          />
        </div>
        <SidebarBanner />
        <HowItWorks stats={data.userStats} />
        {!hideBookmarks && data.bookmarks.length > 0 && (
          <YourBookmarks listings={data.bookmarks} now={data.now}>
            <SectionHeader
              title="BOOKMARKS"
              href="/earn/bookmarks/"
              event="bookmarks_sidebar"
            />
          </YourBookmarks>
        )}
        <RecentEarners earners={data.recentEarners} />
        <RecentActivity
          activity={data.activity}
          now={data.now}
          images={fallbackImages(data.activity.length)}
        />
      </>
    );
  };

  return (
    <div className="flex w-96 flex-col gap-8 py-3 pl-6">{renderContent()}</div>
  );
}
