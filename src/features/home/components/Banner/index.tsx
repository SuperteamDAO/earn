import Autoplay from 'embla-carousel-autoplay';
import { useAtomValue } from 'jotai';
import * as React from 'react';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from '@/components/ui/carousel';

import {
  popupOpenAtom,
  popupsShowedAtom,
} from '@/features/conversion-popups/atoms';

import { HomeSponsorBanner } from './SponsorBanner';
import { HomeTalentBanner } from './TalentBanner';

export function BannerCarousel() {
  const plugin = React.useRef(
    Autoplay({
      delay: 6000,
      stopOnInteraction: false,
      stopOnFocusIn: false,
    }),
  );
  const isPopupOpen = useAtomValue(popupOpenAtom);
  const popupsShowed = useAtomValue(popupsShowedAtom);
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi | undefined>(
    undefined,
  );
  React.useEffect(() => {
    const autoplay = carouselApi?.plugins()?.autoplay;

    if (autoplay) {
      if (isPopupOpen) return autoplay.stop();
      else {
        if (popupsShowed > 0) {
          const resumeTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
            carouselApi.scrollNext();
            plugin.current.options.delay = 5000;
            autoplay.play();
          }, 2000);
          return () => clearTimeout(resumeTimer);
        }
      }
    }
  }, [isPopupOpen, carouselApi, popupsShowed, plugin]);

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full"
      opts={{ loop: true }}
      setApi={setCarouselApi}
    >
      <CarouselContent>
        <CarouselItem>
          <div className="h-full">
            <HomeTalentBanner />
          </div>
        </CarouselItem>
        <CarouselItem>
          <div className="h-full">
            <HomeSponsorBanner />
          </div>
        </CarouselItem>
      </CarouselContent>
      <CarouselDots
        className="absolute bottom-3 left-2/4 -translate-x-2/4 md:bottom-6"
        activeDotClassName="bg-white"
        dotClassName="bg-slate-400"
      />
    </Carousel>
  );
}
