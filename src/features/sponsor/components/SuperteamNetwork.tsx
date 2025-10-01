import React from 'react';

import { cn } from '@/utils/cn';

import { SuperteamIcon } from '../icons/Superteam';
import { maxW } from '../utils/styles';

const GLOBE_URL =
  'https://res.cloudinary.com/dgvnuwspr/image/upload/v1758807164/assets/landingsponsor/icons/globe-maze.webp';

export function SuperteamNetwork() {
  return (
    <section
      className={cn(
        'mx-auto my-10 flex w-full items-center justify-center md:py-16',
        maxW,
        'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
      )}
    >
      <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:flex-row">
        <div className="flex w-full flex-col gap-6 p-6 sm:p-8 md:w-[55%] md:p-10">
          <h2 className="text-[2.45rem] leading-[1.1] font-semibold text-slate-800 sm:text-[2.75rem]">
            Distribute to the Superteam Network
          </h2>

          <div className="h-px w-full max-w-[30rem] bg-slate-200" />

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-[auto_1fr] items-center gap-6">
              <p className="text-[2rem] leading-none font-semibold text-slate-700 md:text-[2.25rem]">
                36,200
              </p>
              <p className="ml-11 text-[0.95rem] text-slate-600 md:text-[1rem]">
                Global Community
              </p>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-center gap-6">
              <p className="text-[2rem] leading-none font-semibold text-slate-700 md:text-[2.25rem]">
                385,000
              </p>
              <p className="ml-6.5 text-[0.95rem] text-slate-600 md:ml-6 md:text-[1rem]">
                Event Attendees
              </p>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-center gap-6">
              <p className="text-[2rem] leading-none font-semibold text-slate-700 md:text-[2.25rem]">
                15
              </p>
              <p className="ml-28 text-[0.95rem] text-slate-600 md:ml-30.5 md:text-[1rem]">
                Countries
              </p>
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-[18rem] flex-1 md:block">
          <img
            src={GLOBE_URL}
            alt="Superteam globe"
            className="pointer-events-none absolute -top-4 -right-12 h-[160%] w-[160%] object-contain opacity-80"
          />
          <SuperteamIcon className="pointer-events-none absolute top-5/8 right-1/8 size-32 -translate-x-1/2 -translate-y-1/2 opacity-90" />
        </div>

        <div className="relative flex h-[12rem] w-full items-center justify-center md:hidden">
          <img
            src={GLOBE_URL}
            alt="Superteam globe"
            className="pointer-events-none relative top-[10rem] -left-10 h-full w-full scale-250 object-contain"
          />
        </div>
      </div>
    </section>
  );
}
