import { X } from 'lucide-react';
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
        className="fixed inset-0 m-0 h-screen w-screen max-w-none rounded-none bg-[#5243FF]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <Pride autorun={{ speed: 10 }} decorateOptions={decorateOptions} />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 h-6 w-6 text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="container mt-28 px-4 md:mt-6">
          <div className="mx-auto mb-11 mt-6 w-28">
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
        <div className="absolute bottom-0 left-1/2 mx-auto mt-auto flex h-auto w-[150%] -translate-x-1/2 flex-col items-end md:w-full lg:w-1/2">
          <Image
            src={ASSET_URL + '/memes/JohnCenaVibingToCupid.gif'}
            alt="John Cena Vibing to Cupid"
            style={{ width: '100%', marginTop: 'auto', display: 'block' }}
            width="1000"
            height="1200"
            priority
            loading="eager"
            quality={80}
            className="scale-125"
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
