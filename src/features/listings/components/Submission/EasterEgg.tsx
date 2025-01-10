import Image from 'next/image';
import Pride from 'react-canvas-confetti/dist/presets/pride';
import { type TDecorateOptionsFn } from 'react-canvas-confetti/dist/types';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ASSET_URL } from '@/constants/ASSET_URL';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isProject: boolean;
}

const decorateOptions: TDecorateOptionsFn = (options) => {
  const colors = [
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

export const EasterEgg = ({ isOpen, onClose, isProject }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="h-screen w-screen max-w-none overflow-hidden rounded-none bg-[#5243FF]"
        onInteractOutside={(e) => e.preventDefault()}
        classNames={{
          closeIcon: 'text-white',
        }}
      >
        <Pride
          autorun={{ speed: 10 }}
          decorateOptions={decorateOptions}
          className="absolute -z-10 h-full w-full"
        />
        <div className="container mx-auto mt-auto px-4 md:mt-6">
          <div className="mx-auto mb-6 mt-6 w-14 md:mb-11 md:w-28">
            <ExternalImage
              src={'/icons/celebration.png'}
              alt="celebration icon"
              className="h-100 w-100"
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
      </DialogContent>
    </Dialog>
  );
};
