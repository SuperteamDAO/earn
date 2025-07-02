import dynamic from 'next/dynamic';

import { Home } from '@/layouts/Home';

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

export default function HomePage() {
  return (
    <Home type="landing">
      <InstallPWAModal />
      <HomepagePop />
      <TalentAnnouncements />
      <div className="w-full">
        <Listings type="home" />
        <GrantsSection type="home" />
      </div>
    </Home>
  );
}
