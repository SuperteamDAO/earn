import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from '@/components/ui/carousel';

interface Feature {
  readonly imageLink: string;
  readonly title: string;
  readonly subtext: string;
  readonly ctaLink: string;
}

const features: Feature[] = [
  {
    imageLink:
      'https://res.cloudinary.com/dgvnuwspr/image/upload/v1761660567/assets/home/sponsor-stages/generate-with-ai.webp',
    title: 'AI Generate',
    subtext:
      'Go from idea prompt to a full fledged listing in under two minutes',
    ctaLink: 'https://x.com/SuperteamEarn/status/1948718195214581841',
  },
  {
    imageLink:
      'https://res.cloudinary.com/dgvnuwspr/image/upload/v1761660567/assets/home/sponsor-stages/generate-with-ai.webp',
    title: 'AI Review',
    subtext:
      'Save hours in time reviewing by using our reliable AI Review agent',
    ctaLink: 'https://x.com/SuperteamEarn/status/1948718195214581841',
  },
  {
    imageLink:
      'https://res.cloudinary.com/dgvnuwspr/image/upload/v1761660567/assets/home/sponsor-stages/generate-with-ai.webp',
    title: 'Boost',
    subtext:
      'Get more eyeballs to your Earn listing by increasing your bounty rewards',
    ctaLink: 'https://x.com/SuperteamEarn/status/1948718195214581841',
  },
];

export function SponsorFeatures() {
  const plugin = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnFocusIn: false,
    }),
  );

  return (
    <div className="w-full">
      <Carousel opts={{ loop: true }} plugins={[plugin.current]}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400">NEW FEATURES</h2>
          <CarouselDots
            className="m-0 flex items-center gap-2"
            dotClassName="bg-slate-200"
            activeDotClassName="bg-slate-500"
          />
        </div>

        <CarouselContent>
          {features.map((feature, index) => (
            <CarouselItem key={index}>
              <div className="rounded-lg border bg-white">
                <div className="rounded-lg bg-slate-100 p-8">
                  <div className="relative aspect-[16/6] w-full overflow-hidden rounded-lg">
                    <Image
                      src={feature.imageLink}
                      alt={feature.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="p-4">
                  <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-0">
                    <span className="text-sm text-emerald-600">Feature</span>
                  </div>

                  <h3 className="mt-2 text-base font-medium text-slate-600">
                    {feature.title}
                  </h3>

                  <p className="mt-1 text-base font-normal text-slate-500">
                    {feature.subtext}
                  </p>

                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link
                      href={feature.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
