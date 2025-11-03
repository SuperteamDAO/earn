import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, CopyIcon } from 'lucide-react';
import posthog from 'posthog-js';
import { useMemo, useState } from 'react';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { CreditIcon } from '../icon/credit';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VerifyResponse = {
  valid: boolean;
  remaining?: number;
  inviter?: { id: string; name: string; photo?: string | null };
  reason?: string;
};

export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const { user } = useUser();
  const [showTerms, setShowTerms] = useState(false);

  const closeModal = () => {
    onClose();
    setShowTerms(false);
  };

  const code = (user?.referralCode || '').toUpperCase();
  const shareUrl = useMemo(() => `earn.superteam.fun/r/${code}`, [code]);

  const { data } = useQuery<VerifyResponse>({
    queryKey: ['referral.verify.self', code],
    queryFn: async () => {
      if (!code) return { valid: false } as VerifyResponse;
      const res = await api.get<VerifyResponse>('/api/user/referral/verify', {
        params: { code },
      });
      return res.data;
    },
    enabled: isOpen && !!code,
  });

  const remaining = data?.remaining ?? 10;

  return (
    <Dialog open={isOpen} onOpenChange={closeModal} modal>
      <DialogContent
        className="w-96 gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {!showTerms ? (
          <div className="relative">
            <div className="bg-gradient-to-t from-[#B861FF]/[0.33] to-violet-50 p-6">
              <div className="flex items-center gap-3">
                <div>
                  <ExternalImage
                    src="/referrals/gift.webp"
                    alt="Referral Modal Icon"
                    className="h-auto w-14"
                  />
                  <h2 className="mt-6 text-xl font-semibold text-slate-800">
                    Get one credit for
                  </h2>
                  <p className="text-xl font-semibold text-slate-500">
                    every friend you invite
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="py-4 text-slate-500">
                You get one credit when a friend you invited makes a non-spam
                submission. You also get bonus credits every time they win.
              </p>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[0.93rem] font-semibold text-slate-500">
                  <CreditIcon className="text-brand-purple size-4" />
                  <span className="text-slate-900">
                    {10 - (10 - remaining)}
                  </span>{' '}
                  / 10 invites left
                </div>
                <button
                  className="text-xs font-medium text-slate-400 underline underline-offset-4"
                  onClick={() => setShowTerms(true)}
                >
                  READ TERMS
                </button>
              </div>

              <div className="-mx-6 my-4 h-px bg-slate-200" />

              <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                <div className="text-sm text-slate-500">Your Code</div>
                <div className="text-right text-base tracking-[2px] text-slate-600">
                  {code || '—'}
                </div>
              </div>

              <div className="relative mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">{shareUrl}</p>
                <CopyButton
                  text={shareUrl}
                  onCopy={() => posthog.capture('copy_referral link')}
                  contentProps={{
                    side: 'right',
                    className: 'text-sm px-2 py-1 text-slate-500',
                  }}
                >
                  <div className="flex items-center gap-1">
                    <CopyIcon className="size-4 text-slate-500" />
                  </div>
                </CopyButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="p-4">
              <button
                onClick={() => setShowTerms(false)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-400"
              >
                <ArrowLeftIcon className="size-4" /> TERMS
              </button>
            </div>

            <div className="px-6 py-4 text-slate-500">
              <ol className="list-decimal space-y-4 pb-6 pl-5">
                <li>
                  Credits are rewarded after your invitee makes a non-spam
                  submission to a listing, upon winner announcement.
                </li>
                <li>You get one extra credit every time your invitee wins.</li>
                <li>
                  You get 10 successful referrals; the link closes after that
                  limit.
                </li>
                <li>We may change, pause, or end this programme anytime.</li>
                <li>Don’t spam or share your link in inappropriate places.</li>
                <li>Suspicious activity may result in account restrictions.</li>
                <li>
                  No self-referrals using alt accounts — we’ll easily catch
                  them.
                </li>
              </ol>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
