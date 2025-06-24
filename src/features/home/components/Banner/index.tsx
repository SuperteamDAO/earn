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

/**
 * the full, interactive client-side carousel.
 * this component is only rendered on the client after the initial page load.
 */
function FullInteractiveCarousel() {
  const plugin = useRef(
    Autoplay({
      delay: 6000,
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

/**
 * an optimized carousel that renders a static version first for performance,
 * and then progressively enhances to the full interactive version on the client.
 */
export function BannerCarousel() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="relative w-full">
        <div className="overflow-hidden">
          <div className="h-full min-w-0 shrink-0 grow-0 basis-full pl-4">
            <HomeTalentBanner />
          </div>
        </div>
        <div
          className="absolute bottom-3 left-2/4 flex -translate-x-2/4 justify-center gap-2 md:bottom-6"
          data-slot="carousel-dots"
        >
          <button
            type="button"
            className="h-1.5 w-1.5 rounded-full bg-white transition-colors md:h-2 md:w-2"
            aria-label="Go to slide 1"
          />
          <button
            type="button"
            className="hover:bg-muted-foreground/50 h-1.5 w-1.5 rounded-full bg-slate-400 transition-colors md:h-2 md:w-2"
            aria-label="Go to slide 2"
          />
        </div>
      </div>
    );
  }

  // once mounted on the client, render the full, interactive carousel.
  return <FullInteractiveCarousel />;
}
