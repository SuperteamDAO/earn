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

import { AspectRatio } from '../ui/aspect-ratio';
import { Button } from '../ui/button';
import { ExternalImage } from '../ui/cloudinary-image';

export const AiReviewFeatureModal = ({
  grant,
}: {
  grant: GrantWithApplicationCount | undefined;
}) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const LOCAL_STORAGE_KEY = 'ai-review-v3-featureModalShown';
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
        <DialogHeader className="relative h-[16.875rem] w-[25rem]">
          <AspectRatio ratio={1.48} className="bg-blue-900">
            <ExternalImage
              className="scale-[1.0] overflow-hidden"
              alt="Ai Review Feature"
              src="ai-review-feature-new"
            />
          </AspectRatio>
          <button
            tabIndex={-1}
            className="ph-no-capture pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 scale-125 cursor-default focus:ring-0 focus:outline-hidden"
            onClick={() => {}}
          >
            <div className="group bg-background relative inline-flex h-10 overflow-hidden rounded-[calc(1.5px+0.375rem-2px)] p-[1.5px] pb-[1.8px] shadow-[0px_2px_2.3px_0px_#0000002B] focus:outline-hidden">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF79C1_0%,#76C5FF_50%,#FF79C1_100%)]" />
              <span className="ph-no-capture bg-background inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-1 text-sm font-medium text-slate-500 backdrop-blur-3xl group-hover:bg-slate-50">
                <img src="/assets/ai-wand.svg" alt="Auto Review AI" />
                Auto Review
              </span>
            </div>
          </button>
        </DialogHeader>
        <div className="p-6 pt-2">
          <DialogTitle className="text-xl font-semibold">
            Auto Review has improved!
          </DialogTitle>
          <DialogDescription className="mt-2 text-base font-normal text-slate-500">
            {`Auto review now considers external links (such as Google Docs,
            Github, Twitter, etc.) and the applicant's profile and proof of work
            on Earn to give more accurate reviews.`}
          </DialogDescription>
          <DialogFooter className="mt-8">
            <DialogClose asChild>
              <Button className="w-full font-semibold focus-visible:ring-0">
                Try it out
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
