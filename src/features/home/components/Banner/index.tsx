import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';

import {
  Carousel,
  CarouselContent,
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
    </Carousel>
  );
}
