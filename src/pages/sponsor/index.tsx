import localFont from 'next/font/local';
import { useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { Meta } from '@/layouts/Meta';
import { cn } from '@/utils/cn';

import { CallOut } from '@/features/sponsor/components/CallOut';
import { FAQs2 } from '@/features/sponsor/components/FAQs2';
import { Footer2 } from '@/features/sponsor/components/Footer2';
import { Header } from '@/features/sponsor/components/Header';
import { Hero } from '@/features/sponsor/components/Hero';
import { HowItWorks } from '@/features/sponsor/components/HowItWorks';
import { ListingExamples } from '@/features/sponsor/components/ListingExamples';
import { Pricing } from '@/features/sponsor/components/Pricing';
import { Stats2 } from '@/features/sponsor/components/Stats2';
import { SuperteamNetwork } from '@/features/sponsor/components/SuperteamNetwork';
import { Testimonials2 } from '@/features/sponsor/components/Testimonials2';
import { Video } from '@/features/sponsor/components/Video';
import { WhyChooseEarn } from '@/features/sponsor/components/WhyChooseEarn';

const font = localFont({
  src: '../../../public/OverusedGrotesk-VF.woff2',
  variable: '--font-overused-grotesk',
  preload: false,
});

const Sponsor = () => {
  const [videoPopup, setVideoPopup] = useState<boolean>(false);

  const VideoPlayback = () => {
    return (
      <div
        className="fixed z-50 grid h-screen w-screen place-content-center bg-[rgba(191,203,220,0.67)]"
        onClick={() => setVideoPopup(false)}
      >
        <div className="relative flex w-[95vw] flex-col gap-5 overflow-hidden pt-[56.25%] lg:w-[60vw]">
          <iframe
            width="100%"
            height="100%"
            className="absolute inset-0"
            src="https://www.youtube.com/embed/tHdS-JNwsgg?autoplay=1&mute=1"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Meta
        title="Find Top Talent for Your Crypto Projects on Superteam Earn"
        description="Seeking top talent for your crypto project? Superteam Earn connects you with experts for Bounties, Projects, and Grants in the crypto space."
        og={ASSET_URL + `/og/sponsor.png`}
      />

      {videoPopup && <VideoPlayback />}

      <Header />

      <div
        className={cn(
          'flex flex-col items-center overflow-hidden bg-white',
          font.className,
        )}
      >
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Hero />
          <WhyChooseEarn />
          <Video showVideo={() => setVideoPopup(true)} />
          <HowItWorks />
          <ListingExamples />
          <Stats2 />
          <Testimonials2 />
          <SuperteamNetwork />
          <Pricing />
          <FAQs2 />
          <CallOut />
          <Footer2 />
        </div>
      </div>
    </>
  );
};

export default Sponsor;
