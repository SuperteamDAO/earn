'use client';

import { useState } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { Superteams } from '@/constants/Superteam';

import SuperteamMap from '../common/SuperteamMap';

const forceFlagForCountries = ['georgia', 'netherlands', 'spain', 'ukraine'];

export default function Geographies() {
  const [hoveredSuperteam, setHoveredSuperteam] = useState<string | null>(null);

  return (
    <div className="col-span-5">
      <h2 className="partners-text section-heading font-secondary mb-10 text-center text-[24px] leading-[22px] font-bold text-white md:mb-10 md:text-[32px] lg:leading-[26px]">
        Find Your Nearest Superteam
      </h2>

      <div className="col-span-5">
        <div className="mx-auto mt-10 max-w-[1200px] px-2">
          <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
            {Superteams.map((superteam) => {
              const showFlag =
                !superteam.icons ||
                forceFlagForCountries.includes(superteam.slug);
              const isHovered = hoveredSuperteam === superteam.code;

              return (
                <div
                  key={superteam.slug}
                  className={`accordion-overlay group z-1 basis-[calc(50%-5px)] rounded-lg object-cover transition-all duration-200 select-none md:basis-auto ${
                    isHovered ? 'superteam-card-hovered scale-[1.02]' : ''
                  } ${hoveredSuperteam && !isHovered ? 'opacity-50' : ''}`}
                  onMouseEnter={() => setHoveredSuperteam(superteam.code)}
                  onMouseLeave={() => setHoveredSuperteam(null)}
                >
                  <div className="st-accordion relative flex h-[40px] w-full flex-row items-center justify-between overflow-hidden rounded-lg pr-2 text-white md:h-[42px] md:pr-3">
                    <div className="relative flex h-full items-center overflow-hidden">
                      {showFlag ? (
                        <div className="flex h-full items-center justify-center px-2 md:px-2">
                          <UserFlag
                            location={superteam.code}
                            size="24px"
                            isCode
                          />
                        </div>
                      ) : (
                        <img
                          src={superteam.icons}
                          alt={superteam.displayValue}
                          className="h-full w-auto object-cover"
                        />
                      )}
                    </div>
                    <div className="h-container flex w-full flex-col text-left md:flex-row md:items-center">
                      <div className="font-secondary z-1 ml-[12px] text-left text-[12px] leading-[14px] font-semibold md:ml-[20px] md:text-[15px] md:leading-[18px] lg:ml-[24px] lg:text-[16px]">
                        <p>{superteam.displayValue}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="-mx-2 w-[calc(100%+16px)] md:-mx-4 md:w-[calc(100%+32px)]">
            <SuperteamMap
              hoveredSuperteam={hoveredSuperteam}
              onHoverChange={setHoveredSuperteam}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
