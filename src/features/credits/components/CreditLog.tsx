import { format } from 'date-fns';
import { Check, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { type ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/cn';

import { CreditIcon } from '../icon/credit';

type CreditEventType =
  | 'SUBMISSION'
  | 'SPAM_PENALTY'
  | 'WIN_BONUS'
  | 'MONTHLY_CREDIT'
  | 'CREDIT_EXPIRY';

interface CreditEntry {
  id: string;
  type: CreditEventType;
  change: number;
  createdAt: Date;
  effectiveMonth: Date;
  submission: {
    listing: {
      title: string;
      type: string;
      slug: string;
      sponsor?: {
        logo: string;
      };
    };
  };
}

interface CreditHistoryCardProps {
  title: ReactNode;
  entries: CreditEntry[];
}

export function CreditHistoryCard({ title, entries }: CreditHistoryCardProps) {
  const posthog = usePostHog();

  const isUpcoming = entries.some((entry) => {
    if (!entry.effectiveMonth) return false;

    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const effectiveDate = new Date(entry.effectiveMonth);
    const effectiveMonth = effectiveDate.getUTCMonth();
    const effectiveYear = effectiveDate.getUTCFullYear();

    if (effectiveYear > currentYear) return true;
    if (effectiveYear === currentYear && effectiveMonth > currentMonth)
      return true;

    return false;
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 px-4 pt-5 pb-3 text-slate-500">
        {title}
      </div>
      <Separator className="flex-1" />
      <div className={cn(isUpcoming && 'opacity-60')}>
        {entries.map((entry) => {
          const isNonLinkableEntry =
            entry.type === 'CREDIT_EXPIRY' || entry.type === 'MONTHLY_CREDIT';

          const EntryContent = () => (
            <>
              <div className="relative">
                <div
                  className={`flex size-8 items-center justify-center overflow-hidden rounded-full sm:size-10`}
                >
                  <img
                    src={
                      entry.submission.listing.sponsor?.logo ||
                      '/android-chrome-512x512.png'
                    }
                    alt="Sponsor logo"
                    className="size-10 rounded-full object-contain"
                  />
                </div>
                {isUpcoming ? (
                  <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-white text-gray-700">
                    <span className="text-xxs">⏳</span>
                  </div>
                ) : (
                  getStatusIcon(entry.type)
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {getEntryTitle(entry)}
                </h3>
                <p className="line-clamp-1 text-xs font-medium text-slate-600 sm:text-sm">
                  {entry.submission.listing.title}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <p
                    className={`text-xs font-semibold text-slate-900 sm:text-sm`}
                  >
                    {entry.change > 0
                      ? `+ ${entry.change} Credit`
                      : `- ${Math.abs(entry.change)} Credit`}
                  </p>
                  <CreditIcon className="text-brand-purple size-4" />
                </div>
                <p className="text-xxs text-slate-500 sm:text-xs">
                  {formatDate(entry)}
                </p>
              </div>
            </>
          );

          return (
            <div key={entry.id}>
              {isNonLinkableEntry ? (
                <div className="flex items-center gap-4 px-4 py-4 hover:bg-slate-100">
                  <EntryContent />
                </div>
              ) : (
                <Link
                  href={`/listing/${entry.submission.listing.slug}`}
                  onClick={() => {
                    posthog.capture('clicked activity_credits');
                  }}
                >
                  <div className="flex cursor-pointer items-center gap-4 px-4 py-4 hover:bg-slate-100">
                    <EntryContent />
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(entry: CreditEntry): string {
  const isSpecialEntry =
    entry.type === 'CREDIT_EXPIRY' || entry.type === 'MONTHLY_CREDIT';

  if (isSpecialEntry) {
    const date = new Date(entry.createdAt);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();

    const localDate = new Date();
    localDate.setFullYear(year, month, day);
    localDate.setHours(hours, minutes, seconds, 0);

    return format(localDate, 'dd MMM, yyyy');
  }
  return format(new Date(entry.createdAt), 'dd MMM, yyyy');
}

function getStatusIcon(type: CreditEventType) {
  if (type === 'SUBMISSION') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-emerald-600 text-white">
        <Check className="size-3" />
      </div>
    );
  }

  if (type === 'MONTHLY_CREDIT') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-emerald-600 text-white">
        <Plus className="size-3" />
      </div>
    );
  }

  if (type === 'CREDIT_EXPIRY') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-red-600 text-white">
        <Minus className="size-3" />
      </div>
    );
  }

  if (type === 'SPAM_PENALTY') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-white text-gray-700">
        <span className="text-xs">🚫</span>
      </div>
    );
  }

  if (type === 'WIN_BONUS') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-white text-gray-700">
        <span className="text-xs">🎉</span>
      </div>
    );
  }

  return null;
}

function getEntryTitle(entry: CreditEntry): string {
  switch (entry.type) {
    case 'SPAM_PENALTY':
      return 'Submission Flagged as Spam';
    case 'WIN_BONUS':
      return entry.submission.listing.type === 'project'
        ? 'Selected for Project'
        : 'Won Bounty';
    case 'SUBMISSION':
      return entry.submission.listing.type === 'project'
        ? 'Applied for Project'
        : 'Submitted to a Bounty';
    case 'MONTHLY_CREDIT':
      const now = new Date();
      const effectiveDate = new Date(entry.effectiveMonth);
      const isUpcoming =
        effectiveDate.getUTCFullYear() > now.getUTCFullYear() ||
        (effectiveDate.getUTCFullYear() === now.getUTCFullYear() &&
          effectiveDate.getUTCMonth() > now.getUTCMonth());

      return isUpcoming
        ? `Credit Renewal for ${format(effectiveDate, 'MMMM')}`
        : `Credits Renewed for ${format(effectiveDate, 'MMMM')}`;
    case 'CREDIT_EXPIRY':
      return `Credits Expired For ${format(new Date(entry.effectiveMonth), 'MMMM')}`;
  }
}
