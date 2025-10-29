import { cookies } from 'next/headers';

import { InstallPWAModal } from '@/components/modals/InstallPWAModal';
import { DefaultApp } from '@/layouts/DefaultApp';
import { privy } from '@/lib/privy';
import { cn } from '@/utils/cn';

import { TalentAnnouncements } from '@/features/announcements/components/TalentAnnouncements';
import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { GrantsSection } from '@/features/grants/components/GrantsSection';
import { BannerCarousel } from '@/features/home/components/Banner';
import { HomeSideBar } from '@/features/home/components/SideBar';
import { UserStatsBanner } from '@/features/home/components/UserStatsBanner';
import { getUserCount } from '@/features/home/utils/user-count';
import { ListingsSection } from '@/features/listings/components/ListingsSection';

export default async function Page() {
  const cookieStore = await cookies();

  const potentialSession = /(^|;)\s*user-id-hint=/.test(cookieStore.toString());

  const totalUsers = await getUserCount();

  const accessToken = cookieStore.get('privy-token')?.value;

  const verifiedClaims = accessToken
    ? await privy.utils().auth().verifyAuthToken(accessToken)
    : undefined;

  const authenticated = verifiedClaims ? !!verifiedClaims?.user_id : false;

  return (
    <DefaultApp className="bg-white">
      <div className={cn('mx-auto w-full px-2 lg:px-6')}>
        <div className="mx-auto w-full max-w-7xl p-0">
          <div className="flex items-start justify-between">
            <div className="w-full lg:border-r lg:border-slate-100">
              <div className="w-full lg:pr-6">
                <div className="pt-3">
                  {potentialSession || authenticated ? (
                    <UserStatsBanner />
                  ) : (
                    <BannerCarousel totalUsers={totalUsers} />
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

            <div className="hidden lg:flex">
              <HomeSideBar type="landing" />
            </div>
          </div>
        </div>
      </div>
      <InstallPWAModal />
      <HomepagePop />
      <TalentAnnouncements />
    </DefaultApp>
  );
}
