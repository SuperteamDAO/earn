import Image from 'next/image';
import { useEffect } from 'react';
import Pride from 'react-canvas-confetti/dist/presets/pride';
import type { TDecorateOptionsFn } from 'react-canvas-confetti/dist/types';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isProject: boolean;
  isPro: boolean;
}

const createDecorateOptions = (isPro: boolean): TDecorateOptionsFn => {
  return (options) => {
    const colors = isPro
      ? [
          '#FFD700',
          '#FFA500',
          '#FFC125',
          '#DAA520',
          '#F4A460',
          '#FFB347',
          '#FFD700',
          '#E6C200',
          '#FFE135',
          '#FFC72C',
          '#F5DEB3',
        ]
      : [
          '#E63946',
          '#F1FAEE',
          '##A8DADC',
          '#457B9D',
          '#1D3557',
          '#F4A261',
          '#E9C46A',
          '#2A9D8F',
          '#FF5733',
          '#FF2400',
          '#FFC0CB',
        ];
    const selectedColors: string[] = [];

    while (selectedColors.length < 5) {
      const randomIndex = Math.floor(Math.random() * colors.length);
      const color = colors[randomIndex];
      if (!selectedColors.includes(color!)) {
        selectedColors.push(color!);
      }
    }

    return {
      ...options,
      particleCount: 20,
      colors: selectedColors,
    };
  };
};

function MainContent({
  isProject,
  isPro,
}: {
  isProject: boolean;
  isPro: boolean;
}) {
  const isMD = useBreakpoint('md');
  return (
    <>
      <Pride
        autorun={{ speed: isMD ? 10 : 5 }}
        decorateOptions={createDecorateOptions(isPro)}
        className="absolute -z-10 h-full w-full"
      />
      {isPro && (
        <>
          <div className="absolute -top-40 right-1/2 -z-30 size-96 translate-x-1/2 rounded-full bg-[#3D3D3D] blur-[180px]" />
          <div className="absolute right-1/2 -bottom-40 -z-30 size-96 translate-x-1/2 rounded-full bg-[#3D3D3D] blur-[120px]" />
          <div className="absolute right-100 bottom-40 -z-30 size-96 translate-x-1/2 rounded-full bg-white/10 blur-[140px]" />
          <div className="absolute bottom-40 left-100 -z-30 size-96 translate-x-1/2 rounded-full bg-white/10 blur-[140px]" />
        </>
      )}
      <div className="container mx-auto mt-auto px-4 md:mt-6">
        <div className="mx-auto mt-6 mb-6 w-14 md:mb-11 md:w-28">
          <ExternalImage
            src={'/icons/celebration.png'}
            alt="celebration icon"
            className="object-contain"
          />
        </div>
        <p className="text-center text-3xl font-medium text-white md:text-4xl">
          {isProject ? 'Application' : 'Submission'} Received!
        </p>
        <p className="mt-5 text-center text-2xl text-white opacity-60 md:text-3xl">
          Sending some vibes your way 💃 💃
        </p>
      </div>
      <div className="mx-auto mt-auto flex h-auto flex-col items-end md:w-full lg:w-1/2">
        <Image
          src={ASSET_URL + '/memes/JohnCenaVibingToCupid.gif'}
          alt="John Cena Vibing to Cupid"
          style={{
            width: '100%',
            height: '100%',
            marginTop: 'auto',
            display: 'block',
          }}
          width="1000"
          height="1200"
          priority
          loading="eager"
          quality={80}
          className="scale-150 md:scale-125"
        />
      </div>
      <audio
        src={'/assets/JohnCenaVibingToCupid.mp3'}
        style={{ display: 'none' }}
        autoPlay
        loop
      />
    </>
  );
}

export const EasterEgg = ({ isOpen, onClose, isProject, isPro }: Props) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      onClose();
    }, 60000); // 60 seconds
    return () => clearTimeout(timeout);
  }, [isOpen, onClose]);

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            'h-screen w-screen max-w-none overflow-hidden rounded-none',
            isPro ? 'bg-black' : 'bg-[#5243FF]',
          )}
          onInteractOutside={(e) => e.preventDefault()}
          classNames={{
            closeIcon: 'text-white',
          }}
        >
          <MainContent isProject={isProject} isPro={isPro} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent
        className={cn(
          'h-screen w-screen max-w-none overflow-hidden rounded-none',
          isPro
            ? 'bg-gradient-to-b from-amber-900 via-yellow-900 to-amber-950'
            : 'bg-[#5243FF]',
        )}
      >
        <MainContent isProject={isProject} isPro={isPro} />
      </DrawerContent>
    </Drawer>
  );
};
