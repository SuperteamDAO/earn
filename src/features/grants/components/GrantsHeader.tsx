import { useRouter } from 'next/router';
import React from 'react';
import { BsFillCircleFill } from 'react-icons/bs';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { LocalImage } from '@/components/ui/local-image';
import { PulseIcon } from '@/svg/pulse-icon';

import { ListingTabLink } from '@/features/listings/components/ListingPage/ListingTabLink';
import { RegionLabel } from '@/features/listings/components/ListingPage/RegionLabel';
import { ListingHeaderSeparator } from '@/features/listings/components/ListingPage/Separator';
import { StatusBadge } from '@/features/listings/components/ListingPage/StatusBadge';

interface Props {
  sponsor?: {
    name: string;
    logo: string;
    isVerified: boolean;
  };
  title: string;
  status: string;
  region: string;
  slug: string;
  references: any;
  isPublished: boolean;
}
export const GrantsHeader = ({
  sponsor,
  title,
  status,
  region,
  slug,
  references,
  isPublished,
}: Props) => {
  let statusTextColor = '';
  let statusText = '';
  let statusIcon = (
    <PulseIcon isPulsing w={4} h={4} bg={'#9AE6B4'} text="#16A34A" />
  );

  if (status === 'OPEN' && isPublished) {
    statusIcon = (
      <PulseIcon isPulsing w={5} h={5} bg={'#9AE6B4'} text="#16A34A" />
    );
    statusTextColor = 'text-green-600';
    statusText = 'Open';
  } else {
    statusIcon = <BsFillCircleFill className="h-3 w-3 text-slate-400" />;
    statusTextColor = 'text-slate-400';
    statusText = 'Closed';
  }

  const router = useRouter();

  return (
    <div className="w-full bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-start gap-5 py-10 md:flex-row md:justify-between">
        <div className="flex flex-col items-start gap-2 md:flex-row">
          <img
            className="h-16 w-16 rounded-md object-cover"
            alt={sponsor?.name}
            src={sponsor?.logo}
          />
          <div className="flex flex-col items-start gap-1">
            <div className="flex flex-wrap items-center gap-1">
              <h1 className="mt-0.5 text-xl font-bold tracking-[-0.5px] text-slate-700">
                {title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-1 md:gap-3">
              <div className="flex items-center gap-1">
                <p className="whitespace-nowrap text-sm font-medium text-slate-400">
                  by {sponsor?.name}
                </p>
                {!!sponsor?.isVerified && <VerifiedBadge />}
              </div>
              <ListingHeaderSeparator />
              <div className="flex items-center gap-1">
                <LocalImage
                  className="-ml-0.5"
                  alt={'grant'}
                  src={'/assets/grant-icon.svg'}
                />
                <p className="text-xs font-medium text-gray-400 md:text-sm">
                  Grant
                </p>
              </div>
              <ListingHeaderSeparator />
              <StatusBadge
                Icon={statusIcon}
                textColor={statusTextColor}
                text={statusText}
              />
              <ListingHeaderSeparator />
              <RegionLabel region={region} isGrant />
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-10 w-full items-center">
        <div className="mx-auto my-auto flex h-full w-full max-w-7xl items-center justify-start gap-10 border-b border-slate-200">
          <ListingTabLink
            className="pointer-events-none hidden md:flex md:w-[22rem]"
            href={`/grants/${slug}/`}
            text="Prizes"
            isActive={false}
          />
          <ListingTabLink
            href={`/grants/${slug}/`}
            text="Details"
            isActive={!router.asPath.split('/')[3]?.includes('references')}
          />

          {references && references?.length > 0 && (
            <ListingTabLink
              href={`/grants/${slug}/references`}
              text="References"
              isActive={!!router.asPath.split('/')[3]?.includes('references')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
