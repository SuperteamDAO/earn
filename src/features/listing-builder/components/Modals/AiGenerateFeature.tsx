// Keep if needed elsewhere, remove if not
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/store/user'; // Keeping useUser

import { AspectRatio } from '../../../../components/ui/aspect-ratio';
import { Button } from '../../../../components/ui/button';
import { ExternalImage } from '../../../../components/ui/cloudinary-image';
import { isAutoGenerateOpenAtom } from '../../atoms';

export const AiGenerateFeatureModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const setAutoGenerateOpen = useSetAtom(isAutoGenerateOpenAtom);
  const posthog = usePostHog();
  const router = useRouter();

  const LOCAL_STORAGE_KEY = 'ai-generate-featureModalShown';

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    onClose();
  };

  useEffect(() => {
    const modalShown = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (
      !modalShown &&
      user &&
      user.currentSponsorId &&
      router.pathname === '/dashboard/new'
    ) {
      setIsOpen(true);
    }
  }, [user, router]);

  const handleAutoGenerate = () => {
    setAutoGenerateOpen(true);
    posthog.capture('announcement_auto-generate');
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[26rem] gap-0 overflow-hidden border-0 p-0 focus:ring-0 sm:rounded-2xl"
        hideCloseIcon
      >
        <DialogHeader className="relative h-[16.875rem] w-full overflow-hidden">
          <AspectRatio ratio={1.48} className="bg-indigo-900">
            {' '}
            <ExternalImage
              className="scale-[1.1] overflow-hidden"
              alt="AI Listing Generation Feature"
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
                <img src="/assets/ai-wand.svg" alt="Auto Generate AI" />
                Auto Generate
              </span>
            </div>
          </button>
        </DialogHeader>
        <div className="p-6">
          <DialogTitle className="text-lg font-semibold">
            Auto Generate your Listings
          </DialogTitle>
          <DialogDescription className="mt-2 text-base font-normal text-slate-500">
            Quickly generate drafts using AI
          </DialogDescription>
          <div className="mt-6 flex flex-wrap justify-between gap-3 pr-4 text-sm">
            <Point text={'Generate drafts in <1 min'} />
            <Point text={'Get properly structured descriptions'} />
            <Point text={'Regenerate descriptions if unsatisfied'} />
          </div>
          <DialogFooter className="mt-8">
            <Button
              onClick={handleAutoGenerate}
              className="w-full font-semibold focus-visible:ring-0"
            >
              Try Now
            </Button>
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
        <circle cx="12.5" cy="12.5" r="12.5" fill="#E0E7FF" />{' '}
        <path
          d="M10.9991 17.0113L7.42676 13.4389L8.31985 12.5458L10.9991 15.2251L16.7494 9.47482L17.6425 10.3679L10.9991 17.0113Z"
          fill="#615FFF"
        />
      </svg>
      <p className="text-base font-medium text-slate-500">{text}</p>
    </span>
  );
}
