'use client';
import { format } from 'date-fns';
import { Check, Minus, Plus, Undo } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { type ReactNode, useEffect, useState } from 'react';

import BsThreeDotsVertical from '@/components/icons/BsThreeDotsVertical';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/cn';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { CreditIcon } from '../icon/credit';
import { canDispute } from '../utils/canDispute';
import { DisputeModal } from './DisputeModal';

type CreditEventType =
  | 'SUBMISSION'
  | 'SPAM_PENALTY'
  | 'WIN_BONUS'
  | 'MONTHLY_CREDIT'
  | 'CREDIT_EXPIRY'
  | 'CREDIT_REFUND'
  | 'GRANT_SPAM_PENALTY'
  | 'GRANT_WIN_BONUS'
  | 'SPAM_DISPUTE'
  | 'GRANT_SPAM_DISPUTE'
  | 'REFERRAL_FIRST_SUBMISSION_BONUS_INVITEE'
  | 'REFERRAL_FIRST_SUBMISSION_BONUS_INVITER'
  | 'REFERRAL_INVITEE_WIN_BONUS_INVITER';

export interface CreditEntry {
  id: string;
  type: CreditEventType;
  change: number;
  createdAt: Date;
  effectiveMonth: Date;
  submission: {
    id: string;
    listing: {
      title: string;
      type: string;
      slug: string;
      sponsor?: {
        logo: string;
      };
    };
    user?: {
      photo: string;
      id: string;
      firstName: string;
    };
  };
  decision: string;
}

interface CreditHistoryCardProps {
  title: ReactNode;
  entries: CreditEntry[];
  disputeSubmissionId?: string | null;
}

export function CreditHistoryCard({
  title,
  entries,
  disputeSubmissionId,
}: CreditHistoryCardProps) {
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CreditEntry | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (disputeSubmissionId && entries.length > 0) {
      const entryToDispute = entries.find(
        (entry) => entry.submission?.id === disputeSubmissionId,
      );
      if (entryToDispute && canDispute(entryToDispute, entries)) {
        setSelectedEntry(entryToDispute);
        setIsDisputeModalOpen(true);
      }
    }
  }, [disputeSubmissionId, entries]);

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

  const handleOpenDispute = (entry: CreditEntry) => {
    setSelectedEntry(entry);
    setIsDisputeModalOpen(true);
  };

  const handleCloseDispute = async () => {
    const currentHash = window.location.hash;
    if (currentHash.startsWith('#dispute-submission-') && pathname) {
      await router.replace(pathname);
    }

    setIsDisputeModalOpen(false);
    setSelectedEntry(null);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 px-4 pt-5 pb-3 text-slate-500">
        {title}
      </div>
      <Separator className="flex-1" />
      <div className={cn(isUpcoming && 'opacity-100')}>
        {entries.map((entry) => {
          const isNonLinkableEntry =
            entry.type === 'CREDIT_EXPIRY' || entry.type === 'MONTHLY_CREDIT';

          const isReferralEntry =
            entry.type === 'REFERRAL_FIRST_SUBMISSION_BONUS_INVITEE' ||
            entry.type === 'REFERRAL_FIRST_SUBMISSION_BONUS_INVITER' ||
            entry.type === 'REFERRAL_INVITEE_WIN_BONUS_INVITER';

          const EntryContent = () => (
            <>
              <div className="relative">
                <div
                  className={`flex size-8 items-center justify-center overflow-hidden rounded-full sm:size-10`}
                >
                  {isReferralEntry ? (
                    <EarnAvatar
                      avatar={entry.submission.user?.photo}
                      id={entry.submission.user?.id}
                      className="size-10 rounded-full object-contain"
                    />
                  ) : (
                    <img
                      src={
                        entry.submission.listing.sponsor?.logo ||
                        '/android-chrome-512x512.png'
                      }
                      alt="Sponsor logo"
                      className="size-10 rounded-full object-contain"
                    />
                  )}
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {getEntryTitle(entry)}
                  </h3>
                  {canDispute(entry, entries) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        <button className="flex items-center justify-center rounded-full px-0.5 hover:bg-slate-100">
                          <BsThreeDotsVertical className="size-3 text-slate-500 sm:size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="z-[100]">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDispute(entry);
                          }}
                          className="cursor-pointer text-red-500 hover:text-red-600"
                        >
                          Raise Dispute
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <p className="line-clamp-1 text-xs font-medium text-slate-600 sm:text-sm">
                  {getEntrySubtitle(
                    entry,
                    entry.submission.user?.firstName || '',
                    entry.submission.listing.title,
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <p
                    className={`text-xs font-semibold text-slate-900 sm:text-sm`}
                  >
                    {entry.type === 'SPAM_DISPUTE' ||
                    entry.type === 'GRANT_SPAM_DISPUTE'
                      ? entry.decision === 'Pending'
                        ? '⏳ Pending'
                        : entry.decision === 'Approved'
                          ? '✅ Approved'
                          : '❌ Rejected'
                      : entry.change > 0
                        ? `+ ${entry.change} Credit`
                        : `- ${Math.abs(entry.change)} Credit`}
                  </p>
                  {entry.type !== 'SPAM_DISPUTE' &&
                    entry.type !== 'GRANT_SPAM_DISPUTE' && (
                      <CreditIcon className="text-brand-purple size-4" />
                    )}
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
                <div className="flex items-center gap-2 px-4 py-4 hover:bg-slate-100 sm:gap-4">
                  <EntryContent />
                </div>
              ) : (
                <Link
                  href={
                    entry.type === 'GRANT_SPAM_PENALTY' ||
                    entry.type === 'GRANT_WIN_BONUS'
                      ? `/grants/${entry.submission.listing.slug}`
                      : `/listing/${entry.submission.listing.slug}`
                  }
                  onClick={() => {
                    posthog.capture('clicked activity_credits');
                  }}
                >
                  <div className="flex cursor-pointer items-center gap-2 px-4 py-4 hover:bg-slate-100 sm:gap-4">
                    <EntryContent />
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={handleCloseDispute}
        entry={selectedEntry}
      />
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

  if (type === 'SPAM_PENALTY' || type === 'GRANT_SPAM_PENALTY') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-white text-gray-700">
        <span className="text-xs">🚫</span>
      </div>
    );
  }

  if (type === 'WIN_BONUS' || type === 'GRANT_WIN_BONUS') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-white text-gray-700">
        <span className="text-xs">🎉</span>
      </div>
    );
  }

  if (type === 'CREDIT_REFUND') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-emerald-600 text-white">
        <Undo className="size-3" />
      </div>
    );
  }

  if (type === 'SPAM_DISPUTE' || type === 'GRANT_SPAM_DISPUTE') {
    return (
      <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-white text-white">
        <span className="text-xs">📝</span>
      </div>
    );
  }

  return null;
}

function getEntryTitle(entry: CreditEntry): string {
  switch (entry.type) {
    case 'CREDIT_REFUND':
      return 'Credit Refunded (Listing Unpublished)';
    case 'SPAM_PENALTY':
      return 'Submission Flagged as Spam';
    case 'WIN_BONUS':
      return entry.submission.listing.type === 'project'
        ? 'Won a Project'
        : entry.submission.listing.type === 'bounty'
          ? 'Won a Bounty'
          : 'Won a Hackathon Track';
    case 'SUBMISSION':
      return entry.submission.listing.type === 'project'
        ? 'Applied for Project'
        : 'Submitted to a Bounty';
    case 'GRANT_SPAM_PENALTY':
      return 'Application Flagged as Spam';
    case 'GRANT_WIN_BONUS':
      return 'Won a Grant';
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
    case 'SPAM_DISPUTE':
      return 'Spam Dispute Submitted';
    case 'GRANT_SPAM_DISPUTE':
      return 'Grant Spam Dispute Submitted';
    case 'REFERRAL_FIRST_SUBMISSION_BONUS_INVITEE':
      return 'Referral Accepted Successfully';
    case 'REFERRAL_FIRST_SUBMISSION_BONUS_INVITER':
      return 'Referred Successfully';
    case 'REFERRAL_INVITEE_WIN_BONUS_INVITER':
      return 'Bonus Referral Credit';
  }
}

function getEntrySubtitle(entry: CreditEntry, name: string, title: string) {
  switch (entry.type) {
    case 'REFERRAL_INVITEE_WIN_BONUS_INVITER':
      return entry.submission.listing.type === 'project'
        ? name + ' won a project'
        : entry.submission.listing.type === 'bounty'
          ? name + ' won a bounty'
          : name + ' won a hackathon track';
    case 'REFERRAL_FIRST_SUBMISSION_BONUS_INVITER':
      return name + ' made an eligible submission';
    case 'REFERRAL_FIRST_SUBMISSION_BONUS_INVITEE':
      return 'You got bonus referral credit';
    default:
      return title;
  }
}
