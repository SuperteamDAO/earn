import { Check, Cross, Info, Minus, Plus } from 'lucide-react';
import Link from 'next/link';

import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

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
  title: string;
  entries: CreditEntry[];
}

export function CreditHistoryCard({ title, entries }: CreditHistoryCardProps) {
  const isUpcoming = title === 'Upcoming Month';

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 px-4 pt-5 pb-3 text-slate-500">
        <h2 className="text-sm font-medium">{title}</h2>
        {isUpcoming && (
          <Tooltip
            contentProps={{ className: 'z-[200]' }}
            content="This shows your win or spam activity for the current month, and how it will affect your Submission Credit balance in the next month."
          >
            <Info className="size-3.5 text-slate-500" />
          </Tooltip>
        )}
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
                  className={`flex size-10 items-center justify-center overflow-hidden rounded-full`}
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
                <p className="text-sm font-medium text-slate-600">
                  {entry.submission.listing.title}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <p className={`text-sm font-semibold text-slate-900`}>
                    {entry.change > 0
                      ? `+ ${entry.change} Credit`
                      : `- ${Math.abs(entry.change)} Credit`}
                  </p>
                  <CreditIcon className="text-brand-purple size-4" />
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(entry.createdAt, isNonLinkableEntry)}
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
                <Link href={`/listing/${entry.submission.listing.slug}`}>
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

function formatDate(date: Date, useLocalTime: boolean): string {
  if (useLocalTime) {
    return dayjs(date).format('DD MMM, YYYY');
  }
  return dayjs(date).utc().format('DD MMM, YYYY');
}

function getStatusIcon(type: CreditEventType) {
  if (type === 'SUBMISSION') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-emerald-500 text-white">
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
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-red-600 text-white">
        <Cross className="size-3" />
      </div>
    );
  }

  if (type === 'WIN_BONUS') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-emerald-600 text-white">
        <Plus className="size-3" />
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
      return 'Credits Renewed';
    case 'CREDIT_EXPIRY':
      return `Credits Expired For ${dayjs(entry.effectiveMonth).format('MMM')}`;
  }
}
