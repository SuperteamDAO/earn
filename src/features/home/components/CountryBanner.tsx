import Image from 'next/image';

import { UserFlag } from '@/components/shared/UserFlag';
import { ASSET_URL } from '@/constants/ASSET_URL';

interface CountryBannerProps {
  readonly countryName: string;
  readonly countryCode: string;
}

export function CountryBanner({
  countryName,
  countryCode,
}: CountryBannerProps) {
  return (
    <div className="relative flex h-52 w-full flex-col items-center md:h-72">
      <Image
        src={ASSET_URL + '/banner/banner'}
        alt={countryName}
        width={1440}
        height={290}
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute top-1/2 flex w-full max-w-7xl -translate-y-1/2 flex-col items-start px-2 md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-white md:text-4xl">
            Remote web3 gigs for talent in {countryName}
          </h2>
          <UserFlag location={countryCode} isCode size="44px" />
        </div>
        <p className="mt-3 max-w-2xl text-left text-sm text-white md:text-lg">
          Get paid like the pros — work remotely for top web3 projects from your
          home in {countryName} through Superteam Earn.
        </p>
      </div>
    </div>
  );
}
