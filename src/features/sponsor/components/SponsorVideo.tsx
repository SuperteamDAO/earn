'use client';

import { useState } from 'react';

import { Video } from './Video';

const VideoPlayback = ({
  setVideoPopup,
}: {
  setVideoPopup: (value: boolean) => void;
}) => {
  return (
    <div
      className="fixed z-50 grid h-screen w-screen place-content-center bg-[rgba(191,203,220,0.67)]"
      onClick={() => setVideoPopup(false)}
    >
      <div className="relative flex w-[95vw] flex-col gap-5 overflow-hidden pt-[56.25%] lg:w-[60vw]">
        {/* YouTube's player needs both scripts and its own origin, which
            no sandbox can grant together. */}
        {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
        <iframe
          width="100%"
          height="100%"
          className="absolute inset-0"
          src="https://www.youtube.com/embed/_OyQ_Bxz1xo?si=U12Uh2foC2Ma914e&autoplay=1&mute=1"
        />
      </div>
    </div>
  );
};

// The landing's video section, and the player it opens over the page.
export function SponsorVideo() {
  const [videoPopup, setVideoPopup] = useState<boolean>(false);
  return (
    <>
      {videoPopup && <VideoPlayback setVideoPopup={setVideoPopup} />}
      <Video showVideo={() => setVideoPopup(true)} />
    </>
  );
}
