'use client';

import { useState } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { Superteams } from '@/constants/Superteam';

import SuperteamMap from '../common/SuperteamMap';

export default function Geographies() {
  const [hoveredSuperteam, setHoveredSuperteam] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="superteam-locations-heading"
      className="col-span-5"
    >
      <h2
        id="superteam-locations-heading"
        className="partners-text section-heading font-secondary mb-10 text-center text-[24px] leading-[22px] font-bold text-white md:mb-10 md:text-[32px] lg:leading-[26px]"
      >
        Find Your Nearest Superteam
      </h2>

      <p className="sr-only">
        Discover Superteam chapters worldwide - Solana and Web3 talent
        communities. Find crypto bounties, blockchain jobs, and grants in your
        region.
      </p>

      <div className="col-span-5">
        <div className="mx-auto mt-10 max-w-[1200px] px-2">
          <ul
            aria-label="Superteam regional chapters"
            className="flex flex-wrap justify-center gap-2.5 md:gap-3"
          >
            {Superteams.map((superteam) => {
              const showFlag = !superteam.icons;
              const isHovered = hoveredSuperteam === superteam.code;
              const hasLink = Boolean(superteam.link && superteam.link.trim());

              const cardContent = (
                <div className="st-accordion relative flex h-[40px] w-full flex-row items-center justify-between overflow-hidden rounded-lg pr-2 text-white md:h-[42px]">
                  <div className="relative flex h-full items-center overflow-hidden">
                    {showFlag ? (
                      <div className="flex h-full items-center justify-center px-1">
                        <UserFlag
                          location={superteam.code}
                          size="20px"
                          isCode
                        />
                      </div>
                    ) : (
                      <img
                        src={superteam.icons}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-auto object-cover"
                      />
                    )}
                  </div>
                  <div className="font-secondary z-1 pl-2 text-left text-[12px] leading-[14px] font-semibold md:text-[15px] md:leading-[18px] lg:text-[16px]">
                    <p>{superteam.displayValue}</p>
                  </div>
                </div>
              );

              const commonClassName = `accordion-overlay group z-1 basis-[calc(50%-5px)] rounded-lg object-cover transition-all duration-200 select-none md:basis-auto ${
                isHovered ? 'superteam-card-hovered scale-[1.02]' : ''
              } ${hoveredSuperteam && !isHovered ? 'opacity-50' : ''}`;

              return (
                <li key={superteam.slug} className="contents">
                  {hasLink ? (
                    <a
                      href={superteam.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${superteam.name} - Solana community in ${superteam.country[0] || superteam.displayValue}`}
                      className={commonClassName}
                      onMouseEnter={() => setHoveredSuperteam(superteam.code)}
                      onMouseLeave={() => setHoveredSuperteam(null)}
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <div
                      aria-label={`${superteam.name} - Coming soon`}
                      className={commonClassName}
                      onMouseEnter={() => setHoveredSuperteam(superteam.code)}
                      onMouseLeave={() => setHoveredSuperteam(null)}
                    >
                      {cardContent}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="-mx-2 w-[calc(100%+16px)] md:-mx-4 md:w-[calc(100%+32px)]">
            <SuperteamMap
              hoveredSuperteam={hoveredSuperteam}
              onHoverChange={setHoveredSuperteam}
            />
          </div>
        </div>
      </div>

      <noscript>
        <div className="mx-auto max-w-[1200px] px-4 py-8">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Superteam Locations - Global Web3 &amp; Solana Communities
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            {Superteams.filter((st) => st.link).map((st) => (
              <li key={st.slug}>
                <a
                  href={st.link}
                  className="text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {st.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </noscript>
    </section>
  );
}
