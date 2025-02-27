import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/store/user'; // Keeping useUser

import {
  type GrantsAi,
  type GrantWithApplicationCount,
} from '@/features/grants/types';
import { type GrantApplicationWithUser } from '@/features/sponsor-dashboard/types';

import { Button } from '../ui/button';
import { ExternalImage } from '../ui/cloudinary-image';

export const AiReviewFeatureModal = ({
  grant,
}: {
  grant: GrantWithApplicationCount | undefined;
}) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const LOCAL_STORAGE_KEY = 'ai-review-featureModalShown';
  const { data: unreviewedApplications } = useQuery<GrantApplicationWithUser[]>(
    {
      queryKey: ['unreviewed-applications', grant?.slug, { id: grant?.id }],
      enabled: !!grant?.slug,
      // Don't refetch this query if it already exists
      staleTime: Infinity,
    },
  );

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  };

  useEffect(() => {
    const modalShown = localStorage.getItem(LOCAL_STORAGE_KEY);

    const isAiReviewButtonVisible =
      !!grant?.isActive &&
      !grant?.isArchived &&
      !!(grant?.ai as GrantsAi)?.context &&
      !!unreviewedApplications?.length;

    if (
      !modalShown &&
      user &&
      !!user.currentSponsorId &&
      isAiReviewButtonVisible
    ) {
      setIsOpen(true);
    }
  }, [user, grant, unreviewedApplications]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[25rem] overflow-hidden border-0 p-0 focus:ring-0 sm:rounded-2xl"
        hideCloseIcon
      >
        <DialogHeader className="relative">
          <ExternalImage
            className="scale-[1.1] overflow-hidden"
            alt="Ai Review Feature"
            src="ai-review-feature-new"
          />
          <button
            tabIndex={-1}
            className="ph-no-capture pointer-events-none absolute left-2/4 top-2/4 -translate-x-2/4 -translate-y-2/4 scale-125 cursor-default focus:outline-none focus:ring-0"
            onClick={() => {}}
          >
            <div className="group relative inline-flex h-10 overflow-hidden rounded-[calc(1.5px+0.375rem-2px)] bg-background p-[1.5px] pb-[1.8px] shadow-[0px_2px_2.3px_0px_#0000002B] focus:outline-none">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF79C1_0%,#76C5FF_50%,#FF79C1_100%)]" />
              <span className="ph-no-capture inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-background px-4 py-1 text-sm font-medium text-slate-500 backdrop-blur-3xl group-hover:bg-slate-50">
                <img src="/assets/ai-wand.svg" alt="Auto Review AI" />
                Auto Review
              </span>
            </div>
          </button>
        </DialogHeader>
        <div className="p-6">
          <DialogTitle className="text-xl font-semibold">
            Grant Auto-Review is Here
          </DialogTitle>
          <DialogDescription className="mt-2 text-lg font-normal text-slate-500">
            Save hundreds of human hours by using Auto-Review for grants
          </DialogDescription>
          <div className="mt-6 flex flex-wrap justify-between gap-3 pr-4">
            <Point text={'Detect Spam'} />
            <Point text={'Save Time'} />
            <Point text={'Identify Top Applications'} />
          </div>
          <DialogFooter className="mt-8">
            <DialogClose asChild>
              <Button className="w-full font-semibold focus-visible:ring-0">
                Try Now
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function Point({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-3">
      <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12.5" cy="12.5" r="12.5" fill="#E0E7FF" />
        <path
          d="M10.9991 17.0113L7.42676 13.4389L8.31985 12.5458L10.9991 15.2251L16.7494 9.47482L17.6425 10.3679L10.9991 17.0113Z"
          fill="#615FFF"
        />
      </svg>
      <p className="text-lg font-medium text-slate-500">{text}</p>
    </span>
  );
}
