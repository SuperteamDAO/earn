import { atom, useAtom } from 'jotai';
import { ArrowRight, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { Tooltip } from '@/components/ui/tooltip';
import { EXPLORER_TX_URL } from '@/constants/project';
import { useClipboard } from '@/hooks/use-clipboard';
import type { SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import type { Listing } from '@/features/listings/types';
import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { Details } from '@/features/sponsor-dashboard/components/Submissions/Details';
import { colorMap } from '@/features/sponsor-dashboard/utils/statusColorMap';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

export const selectedSubmissionAtom = atom<SubmissionWithUser | undefined>(
  undefined,
);

export const sponsorshipSubmissionStatus = (submission: SubmissionWithUser) => {
  if (submission.isPaid) return 'Paid';
  if (submission.status !== 'Pending') return submission.status;
  return submission.label;
};

interface SubmissionDetailsProps {
  open: boolean;
  onClose: () => void;
  submission: SubmissionWithUser;
  bounty: Listing;
}

export const SubmissionDetails = ({
  open,
  onClose,
  submission,
  bounty,
}: SubmissionDetailsProps) => {
  const { onCopy: onCopyEmail } = useClipboard(submission?.user?.email || '');

  const { onCopy: onCopyPublicKey } = useClipboard(
    submission?.user?.publicKey || '',
  );

  const [, setSelectedSubmission] = useAtom(selectedSubmissionAtom);

  useEffect(() => {
    setSelectedSubmission(submission);
  }, [submission]);

  const handleCopyEmail = () => {
    if (submission?.user?.email) {
      onCopyEmail();
      toast.success('Email copied to clipboard', {
        duration: 1500,
      });
    }
  };

  const handleCopyPublicKey = () => {
    if (submission?.user?.publicKey) {
      onCopyPublicKey();
      toast.success('Wallet address copied to clipboard', {
        duration: 1500,
      });
    }
  };

  const status = sponsorshipSubmissionStatus(submission);

  const Content = () => (
    <div className="flex h-full flex-col justify-between sm:w-full md:min-w-[500px]">
      <div className="h-full overflow-y-auto rounded-lg border border-slate-200 px-2 shadow-[0px_1px_3px_rgba(0,0,0,0.08),_0px_1px_2px_rgba(0,0,0,0.06)] md:px-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:w-1.5 [&::-webkit-scrollbar]:w-1">
        <h1 className="mt-3 text-xl">Submission Details</h1>
        <div className="rounded-t-xl border-b border-slate-200 bg-white py-1">
          <div className="flex w-full items-center justify-between pt-3">
            <div className="flex w-full items-center gap-2">
              <EarnAvatar
                className="h-10 w-10"
                id={submission?.user?.id}
                avatar={submission?.user?.photo || undefined}
              />
              <div>
                <p className="w-full whitespace-nowrap font-medium text-slate-900">
                  {`${submission?.user?.firstName}'s Submission`}
                </p>
                <Link
                  className="flex w-full items-center whitespace-nowrap text-xs font-medium text-brand-purple"
                  href={`/t/${submission?.user?.username}`}
                >
                  View Profile <ArrowRight className="inline-block h-3 w-3" />
                </Link>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-center text-[10px] capitalize',
                colorMap[status as keyof typeof colorMap].bg,
                colorMap[status as keyof typeof colorMap].color,
              )}
            >
              {status}
            </span>
            {submission?.isWinner &&
              submission?.winnerPosition &&
              submission?.isPaid && (
                <div className="ph-no-capture hidden items-center justify-end gap-2 md:flex">
                  <Button
                    className="mr-4 text-slate-600"
                    onClick={() => {
                      window.open(
                        `${EXPLORER_TX_URL}${submission?.paymentDetails?.txId}`,
                        '_blank',
                      );
                    }}
                    size="default"
                    variant="ghost"
                  >
                    View Payment Tx
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
          </div>

          <div className="flex flex-col gap-3 py-[1rem] md:flex-row md:items-center md:gap-5">
            {submission?.user?.email && (
              <Tooltip
                content={'Click to copy'}
                contentProps={{ side: 'right' }}
                triggerClassName="flex items-center hover:underline underline-offset-1"
              >
                <div
                  className="flex cursor-pointer items-center justify-start gap-1 text-sm text-slate-400 hover:text-slate-500"
                  onClick={handleCopyEmail}
                  role="button"
                  tabIndex={0}
                  aria-label={`Copy email: ${submission.user.email}`}
                >
                  <MdOutlineMail />
                  {truncateString(submission.user.email, 36)}
                </div>
              </Tooltip>
            )}

            {submission?.user?.publicKey && (
              <Tooltip
                content={'Click to copy'}
                contentProps={{ side: 'right' }}
                triggerClassName="flex items-center hover:underline underline-offset-1"
              >
                <div
                  className="flex cursor-pointer items-center justify-start gap-1 whitespace-nowrap text-sm text-slate-400 hover:text-slate-500"
                  onClick={handleCopyPublicKey}
                  role="button"
                  tabIndex={0}
                  aria-label={`Copy public key: ${truncatePublicKey(submission.user.publicKey, 3)}`}
                >
                  <MdOutlineAccountBalanceWallet />
                  <p>{truncatePublicKey(submission.user.publicKey, 3)}</p>
                </div>
              </Tooltip>
            )}
            <div className="flex gap-2">
              <Telegram
                className="h-[0.9rem] w-[0.9rem] text-slate-600"
                link={submission?.user?.telegram || ''}
              />
              <Twitter
                className="h-[0.9rem] w-[0.9rem] text-slate-600"
                link={submission?.user?.twitter || ''}
              />
              <Website
                className="h-[0.9rem] w-[0.9rem] text-slate-600"
                link={submission?.user?.website || ''}
              />
            </div>
            {(bounty?.type === 'project' || bounty?.type === 'sponsorship') && (
              <p className="whitespace-nowrap text-sm text-slate-400">
                ${formatNumberWithSuffix(submission?.totalEarnings || 0)} Earned
              </p>
            )}
          </div>
        </div>
        <div className="flex w-full border-t border-slate-200">
          <Details
            bounty={bounty}
            modalView={true}
            atom={selectedSubmissionAtom}
          />
        </div>
      </div>
      <Button
        className="ph-no-capture my-4 h-12 w-full"
        type="button"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );

  return (
    <SideDrawer open={open} onClose={onClose}>
      <SideDrawerContent className="w-full">
        <X
          className="absolute right-4 top-10 z-10 h-4 w-4 text-slate-400 sm:right-8 sm:top-8"
          onClick={onClose}
        />
        <Content />
      </SideDrawerContent>
    </SideDrawer>
  );
};
