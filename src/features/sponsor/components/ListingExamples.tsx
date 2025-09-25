import { useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { cn } from '@/utils/cn';

import { maxW, maxW2 } from '../utils/styles';

type ListingExampleCard = {
  title: string;
  background: string;
  text: 'light' | 'dark';
  imageUrl?: string;
};

const assets = ASSET_URL + '/landingsponsor/listing-examples';

const CARDS: readonly ListingExampleCard[] = [
  {
    title: 'Twitter Threads',
    background: '#312e81',
    text: 'light',
    imageUrl: assets + '/twitter-threads',
  },
  {
    title: 'Hype Videos',
    background: '#6366f1',
    text: 'light',
    imageUrl: assets + '/hype-videos',
  },
  {
    title: 'Landing Pages',
    background: '#D069FF',
    text: 'light',
    imageUrl: assets + '/landing-pages.webp',
  },
  {
    title: 'Graphic Design',
    background: '#38FFAC',
    text: 'dark',
    imageUrl: assets + '/graphic-design',
  },
  {
    title: 'Frontend Development',
    background: '#B2FF00',
    text: 'dark',
    imageUrl: assets + '/frontend-development',
  },
  {
    title: 'Smart Contract Development',
    background: '#5FFFFC',
    text: 'dark',
    imageUrl: assets + '/smart-contract-development',
  },
  {
    title: 'UI/UX Design',
    background: '#69CBFF',
    text: 'dark',
    imageUrl: assets + '/ui-ux-design',
  },
  {
    title: 'Logo Design',
    background: '#383FFF',
    text: 'light',
    imageUrl: assets + '/logo-design',
  },
] as const;

export function ListingExamples() {
  const [isPaused, setIsPaused] = useState(false);

  // Create enough copies for seamless scrolling
  const multipliedCards = [...CARDS, ...CARDS];
  return (
    <section>
      <div
        className={cn(
          'relative mx-auto my-24 w-full px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
          maxW,
        )}
      >
        <div
          className={cn(
            'relative mx-auto flex w-full flex-col items-start py-6 md:flex-row md:py-10 lg:gap-30',
            maxW2,
          )}
        >
          <h2 className="w-fit max-w-sm text-center text-[2rem] leading-[1.1] font-semibold text-slate-800 md:text-left md:text-[3.5rem]">
            Hire Across All Kinds of Skills
          </h2>
          <p className="text-base text-slate-500 md:text-[1.2rem]">
            Thousands of designers, thread writers, devs, community managers,
            and many other highly skilled freelancers ready for work on Earn.
          </p>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div
          className="flex gap-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            animation: 'marquee 30s linear infinite',
            animationPlayState: isPaused ? 'paused' : 'running',
            width: 'max-content',
          }}
        >
          {multipliedCards.map((card, index) => {
            const isDarkText = card.text === 'dark';
            const titleColor = isDarkText ? 'text-black' : 'text-white';
            return (
              <div
                key={`${card.title}-${index}`}
                className="h-[21.9375rem] w-[16.5625rem] flex-shrink-0"
              >
                <div
                  className={cn(
                    'relative h-full overflow-hidden rounded-2xl p-6',
                    titleColor,
                  )}
                  style={{ backgroundColor: card.background }}
                >
                  <div className={cn('absolute bottom-0 left-0 h-full w-full')}>
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="h-full w-full overflow-hidden object-cover"
                    />
                  </div>
                  <div className="relative text-lg font-medium md:text-2xl">
                    {card.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
