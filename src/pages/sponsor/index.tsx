import localFont from 'next/font/local';
import { useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { FAQs } from '@/features/sponsor/components/FAQs';
import { Features } from '@/features/sponsor/components/Features';
import { Footer } from '@/features/sponsor/components/Footer';
import { Header } from '@/features/sponsor/components/Header';
import { Hero } from '@/features/sponsor/components/Hero';
import { ListingTypes } from '@/features/sponsor/components/ListingTypes';
import { ListingWork } from '@/features/sponsor/components/ListingWork';
import { Stats } from '@/features/sponsor/components/Stats';
import { Testimonials } from '@/features/sponsor/components/Testimonials';
import { Meta } from '@/layouts/Meta';
import { cn } from '@/utils/cn';

const font = localFont({
  src: '../../../public/OverusedGrotesk-VF.woff2',
  variable: '--font-overused-grotesk',
});

const Sponsor = () => {
  const [videoPopup, setVideoPopup] = useState<boolean>(false);

  const VideoPlayback = () => {
    return (
      <div
        className="fixed z-50 grid h-screen w-screen place-content-center bg-[rgba(191,203,220,0.67)] font-sans"
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
        style={font.style}
      >
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Hero />
          <ListingTypes />
          <Features showVideo={() => setVideoPopup(true)} />
          <Stats />
          <ListingWork />
          <Testimonials />
          <FAQs />
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Sponsor;
