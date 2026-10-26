'use client';

import { Globe, InfoIcon, Pencil } from 'lucide-react';
import Link from 'next/link';

import FaXTwitter from '@/components/icons/FaXTwitter';
import { LinkTextParser } from '@/components/shared/LinkTextParser';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { getURLSanitized } from '@/utils/getURLSanitized';

const dollars = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export interface SponsorHeaderData {
  readonly name: string;
  readonly logo: string | null;
  readonly url: string | null;
  readonly twitter: string | null;
  readonly bio: string | null;
  readonly isVerified: boolean;
}

// The sponsor page's header (Earn's markup).
export function SponsorHeader({
  sponsor,
  totalRewardAmount,
  completionRate,
}: {
  readonly sponsor: SponsorHeaderData;
  readonly totalRewardAmount: number;
  readonly completionRate: number;
}) {
  const { logo, url, twitter, isVerified, name, bio } = sponsor;
  return (
    <div className="flex bg-slate-50 px-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-[10] py-14 md:flex-row md:px-4">
        <div className="justify-center rounded-md">
          <LocalImage
            className="size-20 rounded-md"
            alt="Category icon"
            src={logo ?? ''}
          />
        </div>

        <div className="w-full md:w-[80%]">
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold">{name}</p>
            {isVerified && (
              <VerifiedBadge
                style={{
                  width: '1rem',
                  height: '1rem',
                }}
              />
            )}
          </div>

          {bio && (
            <LinkTextParser
              className="mt-1 font-normal text-slate-500 md:mt-2"
              text={bio}
            />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="flex items-center gap-1">
              <p>${dollars.format(totalRewardAmount)}</p>
              <p className="font-medium text-slate-500">Rewarded</p>
              <Separator orientation="vertical" className="ml-1 h-4" />
            </span>
            <span className="flex items-center gap-1">
              <p>{completionRate.toFixed(0)}%</p>
              <p className="font-medium text-slate-500">Completion Rate</p>
              <Tooltip
                content={
                  'The number of bounties where winners were announced divided by the total number of eligible bounties published'
                }
              >
                <InfoIcon className="h-3 w-3 text-slate-400" />
              </Tooltip>
              <Separator
                orientation="vertical"
                className="ml-1 hidden h-4 md:block"
              />
            </span>

            <span className="mt-3 flex w-full basis-full items-center gap-2 md:mt-0 md:w-auto md:basis-auto">
              {twitter && (
                <Link
                  className="flex items-center"
                  href={twitter}
                  target="_blank"
                >
                  <FaXTwitter className="h-4 w-4 fill-slate-500" />
                </Link>
              )}
              {url && (
                <Link
                  className="flex items-center"
                  href={getURLSanitized(url)}
                  target="_blank"
                >
                  <Globe className="h-4 w-4 text-slate-500" />
                </Link>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// What the sponsor's list shows when empty (Earn's customEmptySection).
export function SponsorEmptySection({
  title,
  message,
  buttonText,
  buttonHref,
}: {
  readonly title: string;
  readonly message: string;
  readonly buttonText: string;
  readonly buttonHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-slate-100">
        <Pencil className="h-8 w-8 text-slate-500" />
      </div>
      <h3 className="mb-2 text-lg leading-[1.2] font-semibold text-slate-700">
        {title}
      </h3>
      <p className="mb-6 text-slate-500">{message}</p>
      <Button variant="default" className="rounded-[0.5rem] px-10" asChild>
        <Link
          href={buttonHref}
          target={buttonHref.startsWith('http') ? '_blank' : undefined}
        >
          {buttonText}
        </Link>
      </Button>
    </div>
  );
}
