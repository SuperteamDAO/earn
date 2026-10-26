import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import localFont from 'next/font/local';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { pageMetadata } from '@/lib/metadata';
import { canResume } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorLanding from '@/server/sponsor-landing';
import { cn } from '@/utils/cn';
import { generateOrganizationSchema } from '@/utils/json-ld';

import { CallOut } from '@/features/sponsor/components/CallOut';
import { FAQs } from '@/features/sponsor/components/FAQs';
import { Footer } from '@/features/sponsor/components/Footer';
import { Header } from '@/features/sponsor/components/Header';
import { Hero } from '@/features/sponsor/components/Hero';
import { HowItWorks } from '@/features/sponsor/components/HowItWorks';
import { ListingExamples } from '@/features/sponsor/components/ListingExamples';
import { Pricing } from '@/features/sponsor/components/Pricing';
import { SponsorVideo } from '@/features/sponsor/components/SponsorVideo';
import { Stats } from '@/features/sponsor/components/Stats';
import { SuperteamNetwork } from '@/features/sponsor/components/SuperteamNetwork';
import { Testimonials } from '@/features/sponsor/components/Testimonials';
import { TrustedTeams } from '@/features/sponsor/components/TrustedTeams';
import { WhyChooseEarn } from '@/features/sponsor/components/WhyChooseEarn';

const font = localFont({
  src: '../../../../public/OverusedGrotesk-VF.woff2',
  variable: '--font-overused-grotesk',
  preload: false,
});

export const metadata = pageMetadata({
  title: 'Find Top Talent for Your Crypto Projects on Superteam Earn',
  description:
    'Seeking top talent for your crypto project? Superteam Earn connects you with experts for Bounties, Projects, and Grants in the crypto space.',
  canonical: 'https://superteam.fun/earn/sponsor/',
  og: ASSET_URL + `/og/sponsor.png`,
});

// Earn's JsonLd, inline: App Router hoists nothing, and the script works in
// the body as well.
const organizationJsonLd = JSON.stringify(generateOrganizationSchema()).replace(
  /</g,
  '\\u003c',
);

export default async function SponsorLandingPage() {
  const [stats, resuming] = await Promise.all([
    // The numbers are decoration: without them the page still renders.
    runtime.runPromise(
      SponsorLanding.SponsorLanding.use((landing) => landing.stats).pipe(
        Effect.option,
        Effect.map(Option.getOrUndefined),
      ),
    ),
    canResume(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // JSON with `<` escaped, so it can't close the script.
        // oxlint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
      />

      <Header resuming={resuming} />

      <div
        className={cn(
          'flex flex-col items-center overflow-hidden bg-white',
          font.className,
        )}
      >
        <div className="relative flex w-full flex-col overflow-hidden">
          <Hero />
          <TrustedTeams />
          <WhyChooseEarn />
          <SponsorVideo />
          <HowItWorks />
          <ListingExamples />
          <Stats users={stats} totals={stats} />
          <Testimonials />
          <SuperteamNetwork />
          <Pricing />
          <FAQs />
          <CallOut />
          <Footer />
        </div>
      </div>
    </>
  );
}
