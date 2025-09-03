import React from 'react';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';

interface NudgeProps {
  setNudgeState: (state: boolean) => void;
  onOpenReferral?: () => void;
}

export const Nudge = ({ setNudgeState, onOpenReferral }: NudgeProps) => {
  const openReferralWithEvent = () => {
    onOpenReferral?.();
    setNudgeState(false);
  };

  return (
    <>
      <div className="w-full rounded-lg bg-white sm:w-96">
        <div className="flex flex-col gap-2 rounded-t-lg">
          <div className="flex h-56 w-full items-center gap-2 rounded-t-lg bg-slate-50">
            <ExternalImage
              src="/referrals/nudge.webp"
              className="mx-auto h-12 rounded-t-lg"
              alt="Nudge"
            />
          </div>
          <div className="px-3 pt-2 pb-3">
            <p className="text-lg font-semibold text-slate-900">
              Earn Free Credits
            </p>
            <p className="my-2 text-sm text-slate-500">
              Invite your friends to Earn and get free credits when they make
              their first submission!
            </p>
            <Button onClick={openReferralWithEvent} className="mt-3 w-full">
              Refer Now
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
