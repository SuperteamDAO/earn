import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';

import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from '@/components/ui/carousel';

import { HomeSponsorBanner } from './SponsorBanner';
import { HomeTalentBanner } from './TalentBanner';

export function BannerCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full p-1"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{ loop: true }}
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
