import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';

export const SidebarBanner = () => {
  return (
    <Link href="/firehose">
      <div
        className={`relative flex h-[22rem] w-full flex-col items-center overflow-hidden rounded-xl border border-white/20`}
      >
        <ExternalImage
          src={'/hackathon/fff/square.png'}
          alt="Breakout Hackathon"
          className="absolute left-0 top-0 h-full w-full"
        />

        <div className="relative z-10 flex h-full w-full flex-col px-4 pb-9 pt-6 text-black">
          <Button
            variant="secondary"
            className={`mb-2 mt-auto w-full rounded-md bg-white text-base font-bold text-black hover:bg-white/70`}
          >
            SUBMIT NOW
          </Button>
        </div>
      </div>
    </Link>
  );
};
