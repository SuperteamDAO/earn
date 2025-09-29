import Autoplay from 'embla-carousel-autoplay';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

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

interface BannerCarouselProps {
  readonly totalUsers?: number | null;
}

/**
 * an optimized carousel that renders a static version first for performance,
 * and then progressively enhances to the full interactive version on the client.
 */
export function BannerCarousel({ totalUsers }: BannerCarouselProps) {
  const plugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnFocusIn: false,
    }),
  );
  const isPopupOpen = useAtomValue(popupOpenAtom);
  const popupsShowed = useAtomValue(popupsShowedAtom);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>(
    undefined,
  );
  useEffect(() => {
    const autoplay = carouselApi?.plugins()?.autoplay;

    if (autoplay) {
      if (isPopupOpen) return autoplay.stop();

      if (popupsShowed > 0) {
        const resumeTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
          carouselApi.scrollNext();
          plugin.current.options.delay = 5000;
          autoplay.play();
        }, 2000);
        return () => clearTimeout(resumeTimer);
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
          <HomeTalentBanner totalUsers={totalUsers} />
        </CarouselItem>
        {/* <CarouselItem>
          <HomeCypherpunkBanner />
        </CarouselItem> */}
        <CarouselItem>
          <HomeSponsorBanner totalUsers={totalUsers} />
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
