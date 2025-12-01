import { useQuery } from '@tanstack/react-query';
import localFont from 'next/font/local';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import MdCheck from '@/components/icons/MdCheck';
import ProGradientIcon from '@/components/icons/ProGradientIcon';
import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { userCountQuery } from '@/features/home/queries/user-count';
import { RandomArrow } from '@/features/pro/components/RandomArrow';

const LOCAL_STORAGE_KEY = 'sponsorAnnouncementsSeen-pro-listings';

const font = localFont({
  src: '../../../../public/PerfectlyNineties.otf',
  variable: '--font-perfectly-nineties',
  preload: false,
});

export function ProListingsAnnouncement({
  isAnyModalOpen,
  forceOpen,
  onOpenChange,
}: {
  isAnyModalOpen?: boolean;
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const user = useUser();
  const [showModal, setShowModal] = useState(false);
  const { data: userCountData } = useQuery(userCountQuery);

  const roundedUserCount =
    userCountData?.totalUsers != null
      ? Math.round(userCountData.totalUsers / 10000) * 10000
      : 150000;

  useEffect(() => {
    if (forceOpen !== undefined) {
      setShowModal(forceOpen);
      onOpenChange?.(forceOpen);
      return;
    }

    if (isAnyModalOpen) return;
    const seen = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!seen && !!user.user?.currentSponsorId) {
      setShowModal(true);
    }
  }, [forceOpen, isAnyModalOpen, user.user?.currentSponsorId, onOpenChange]);

  const isLoggedInAndIsSponsor = Boolean(
    user.user && !!user.user.currentSponsorId,
  );

  if (!isLoggedInAndIsSponsor || !showModal) return null;

  function handleModalClose() {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setShowModal(false);
    onOpenChange?.(false);
  }

  return (
    <Dialog open={showModal} onOpenChange={handleModalClose}>
      <DialogContent
        hideCloseIcon
        className="z-[500] w-full max-w-md overflow-hidden border-0 bg-transparent p-0 sm:rounded-xl"
        autoFocus={false}
        classNames={{
          overlay: 'z-[500]',
        }}
      >
        <div className="mx-auto w-full overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="relative overflow-hidden bg-black px-6 pt-6 pb-8">
            <RandomArrow className="absolute top-0 left-0 opacity-60" />
            <div className="absolute -top-10 -left-10 size-64 rounded-full bg-white/20 blur-[60px]" />

            <AnimatedDots
              dotSize={3}
              colors={['#a1a1aa']}
              columns={50}
              rows={6}
              spacing={1.5}
              className="absolute top-0 right-1/2 z-10 mt-0.5 translate-x-1/2 opacity-80 transition-colors duration-500"
            />

            <div className="relative z-10 flex flex-col items-center justify-center pt-4">
              <ProGradientIcon className="size-8" />
              <p
                className={cn(
                  'mt-6 text-center text-4xl text-white',
                  font.className,
                )}
              >
                Reach the
                <br />
                top 1%
              </p>
            </div>
          </div>

          <div className="bg-white px-6 pt-8 pb-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">
              We heard you.
            </h2>
            <p className="mb-6 text-base font-medium text-slate-500">
              You told us about the quality concerns and we wanted to tell you
              about — Pro Listings. A way to target the top 1% talent on our
              platform.
            </p>

            <Separator className="mt-2 mb-6" />

            <ul className="mb-6 space-y-3">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <MdCheck className="size-3 text-slate-400" />
                </div>
                <span className="text-sm text-slate-600">
                  Hand-vetted talent, no surprises
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <MdCheck className="size-3 text-slate-400" />
                </div>
                <span className="text-sm text-slate-600">
                  Top 1% of {roundedUserCount.toLocaleString()} people
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <MdCheck className="size-3 text-slate-400" />
                </div>
                <span className="text-sm text-slate-600">
                  Quality, not quantity
                </span>
              </li>
            </ul>

            <Button
              asChild
              className="bg-brand-purple hover:bg-brand-purple/90 w-full rounded-lg text-white"
            >
              <Link
                href="https://x.com/superteamearn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
