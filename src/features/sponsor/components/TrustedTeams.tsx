import { useState } from 'react';

import { HighQualityImage } from './HighQualityImage';

type CompanyLogo = {
  src: string;
  alt: string;
  className: string;
};

const base = '/landingsponsor/sponsors/';

const COMPANY_LOGOS: readonly CompanyLogo[] = [
  {
    src: base + 'squads.webp',
    alt: 'Squads Logo',
    className: 'h-6',
  },
  {
    src: base + 'pyth.webp',
    alt: 'Pyth',
    className: 'h-6',
  },
  {
    src: base + 'tensor.webp',
    alt: 'Tensor Logo',
    className: 'h-8',
  },
  {
    src: base + 'jupiter.webp',
    alt: 'Jupiter Logo',
    className: 'h-6',
  },
  {
    src: base + 'solana-foundation.webp',
    alt: 'Solana Foundation',
    className: 'h-6',
  },
  {
    src: base + 'helius.webp',
    alt: 'Helius',
    className: 'h-6',
  },
  {
    src: base + 'perena.webp',
    alt: 'Perena',
    className: 'h-6',
  },
  {
    src: base + 'civic.webp',
    alt: 'Civic',
    className: 'h-6',
  },
  {
    src: base + 'de.webp',
    alt: 'De Logo',
    className: 'h-12',
  },
  {
    src: base + 'madlads.webp',
    alt: 'Madlads Logo',
    className: 'h-10',
  },
  {
    src: base + 'solflare.webp',
    alt: 'Solflare Logo',
    className: 'h-10',
  },
  {
    src: base + 'meteora.webp',
    alt: 'Meteora Logo',
    className: 'h-8',
  },
  {
    src: base + 'monkedao.webp',
    alt: 'MonkeDao Logo',
    className: 'h-6',
  },
  {
    src: base + 'bonk.webp',
    alt: 'Bonk Logo',
    className: 'h-8',
  },
  {
    src: base + 'okx.webp',
    alt: 'OKX Logo',
    className: 'h-8',
  },
  {
    src: base + 'tars',
    alt: 'Tars Logo',
    className: 'h-8',
  },
] as const;

export function TrustedTeams() {
  const [isPaused, setIsPaused] = useState(false);

  const multipliedLogos = [
    ...COMPANY_LOGOS,
    ...COMPANY_LOGOS,
    ...COMPANY_LOGOS,
  ];

  return (
    <section>
      <div className="relative mt-4 w-full overflow-hidden">
        <div
          className="flex items-center gap-20"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            animation: 'marquee 50s linear infinite',
            animationPlayState: isPaused ? 'paused' : 'running',
            width: 'max-content',
          }}
        >
          {multipliedLogos.map((logo, index) => (
            <div
              key={`${logo.alt}-${index}`}
              className="flex-shrink-0 transition-opacity"
            >
              <HighQualityImage
                src={logo.src}
                alt={logo.alt}
                className={logo.className}
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </section>
  );
}
