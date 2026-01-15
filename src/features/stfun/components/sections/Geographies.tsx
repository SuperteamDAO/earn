'use client';

import { useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

const countries = [
  {
    key: 'india',
    name: 'India',
    path: `${ASSET_URL}/st/chapters/india.webp`,
    href: 'https://in.superteam.fun/',
  },
  {
    key: 'vietnam',
    name: 'Vietnam',
    path: `${ASSET_URL}/st/chapters/vietnam.webp`,
    href: 'https://vn.superteam.fun/',
  },
  {
    key: 'germany',
    name: 'Germany',
    path: `${ASSET_URL}/st/chapters/germany.webp`,
    href: 'https://de.superteam.fun/',
  },
  {
    key: 'uk',
    name: 'UK',
    path: `${ASSET_URL}/st/chapters/uk.webp`,
    href: 'https://uk.superteam.fun/',
  },
  {
    key: 'uae',
    name: 'UAE',
    path: `${ASSET_URL}/st/chapters/uae.webp`,
    href: 'https://uae.superteam.fun/',
  },
  {
    key: 'nigeria',
    name: 'Nigeria',
    path: `${ASSET_URL}/st/chapters/nigeria.webp`,
    href: 'https://ng.superteam.fun/',
  },
  {
    key: 'balkan',
    name: 'Balkan',
    path: `${ASSET_URL}/st/chapters/balkan.webp`,
    href: 'https://blkn.superteam.fun/',
  },
  {
    key: 'malaysia',
    name: 'Malaysia',
    path: `${ASSET_URL}/st/chapters/malaysia.webp`,
    href: 'https://my.superteam.fun/',
  },
  {
    key: 'france',
    name: 'France',
    path: `${ASSET_URL}/st/chapters/france.webp`,
    href: 'https://fr.superteam.fun/',
  },
  {
    key: 'japan',
    name: 'Japan',
    path: `${ASSET_URL}/st/chapters/japan.webp`,
    href: 'https://jp.superteam.fun/',
  },
  {
    key: 'singapore',
    name: 'Singapore',
    path: `${ASSET_URL}/st/chapters/singapore.webp`,
    href: 'https://sg.superteam.fun/',
  },
  {
    key: 'canada',
    name: 'Canada',
    path: `${ASSET_URL}/st/chapters/canada.webp`,
    href: 'https://ca.superteam.fun/',
  },
  {
    key: 'poland',
    name: 'Poland',
    path: `${ASSET_URL}/st/chapters/poland.webp`,
    href: 'https://pl.superteam.fun/',
  },
  {
    key: 'korea',
    name: 'Korea',
    path: `${ASSET_URL}/st/chapters/korea.webp`,
    href: 'https://kr.superteam.fun/',
  },
  {
    key: 'indonesia',
    name: 'Indonesia',
    path: `${ASSET_URL}/st/chapters/indonesia.webp`,
    href: 'https://id.superteam.fun/',
  },
  {
    key: 'ireland',
    name: 'Ireland',
    path: `${ASSET_URL}/st/chapters/ireland.webp`,
    href: 'https://x.com/superteamIE',
  },
];

const FIRST_PART = 12;

export default function Geographies() {
  const [showAllPartners, setShowAllPartners] = useState(false);

  const displayedCountries = showAllPartners
    ? countries
    : countries.slice(0, FIRST_PART);
  const remainingCountries = countries.slice(FIRST_PART);

  return (
    <div className="col-span-5">
      <h2 className="partners-text section-heading font-secondary mb-10 text-center text-[24px] leading-[22px] font-bold text-white md:text-[32px] lg:leading-[26px]">
        Find Your Nearest Superteam
      </h2>

      <div className="col-span-5 mt-10">
        <div className="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-8 md:px-16 lg:grid-cols-3 xl:grid-cols-3">
          {displayedCountries.map((country) => (
            <a
              key={country.key}
              href={country.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mx-auto aspect-4/3 w-full max-w-[450px] overflow-hidden rounded-lg bg-black"
            >
              <img
                src={country.path}
                alt={country.name}
                className="h-full w-full object-cover opacity-80 transition-all duration-300 group-hover:scale-105 group-hover:opacity-60"
              />
              <h3 className="font-secondary absolute bottom-6 left-6 text-2xl font-bold text-white">
                {country.name}
              </h3>
            </a>
          ))}
        </div>

        {remainingCountries.length > 0 && !showAllPartners && (
          <div className="mt-8 flex justify-center">
            <button
              className="font-secondary rounded-md bg-white px-6 py-3 text-black hover:bg-gray-200"
              onClick={() => setShowAllPartners(true)}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
