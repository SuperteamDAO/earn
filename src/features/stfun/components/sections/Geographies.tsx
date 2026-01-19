'use client';

import { useState } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { Superteams } from '@/constants/Superteam';

import SuperteamMap from '../common/SuperteamMap';

export default function Geographies() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [hoveredSuperteam, setHoveredSuperteam] = useState<string | null>(null);

  const handleImageError = (slug: string) => {
    setImageErrors((prev) => ({ ...prev, [slug]: true }));
  };

  return (
    <div className="col-span-5">
      <h2 className="partners-text section-heading font-secondary mb-10 text-center text-[24px] leading-[22px] font-bold text-white md:text-[32px] lg:leading-[26px]">
        Find Your Nearest Superteam
      </h2>

      <div className="col-span-5 mt-10">
        <div className="mx-auto mt-0 max-w-[1200px] px-2 md:px-4 lg:mt-[53px]">
          <div className="mb-10 flex flex-wrap justify-center gap-2.5 md:gap-3">
            {Superteams.map((superteam) => {
              const hasImageError = imageErrors[superteam.slug];
              const showFlag = hasImageError || !superteam.icons;
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
                          onError={() => handleImageError(superteam.slug)}
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
