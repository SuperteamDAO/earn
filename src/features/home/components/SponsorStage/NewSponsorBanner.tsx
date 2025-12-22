import { PenLine } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';

export function NewSponsorBanner() {
  const handleCreateBountyClick = () => {
    posthog.capture('create bounty_sponsor stage banner', {
      stage: 'NEW_SPONSOR',
    });
    posthog.capture('click_sponsor stage banner', {
      stage: 'NEW_SPONSOR',
    });
  };

  const handleGetHelpClick = () => {
    posthog.capture('get help_sponsor stage banner', {
      stage: 'NEW_SPONSOR',
    });
  };

  return (
    <Link
      href="/dashboard/listings?open=1"
      className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8"
      onClick={handleCreateBountyClick}
      prefetch={false}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg">
            <PenLine className="h-6 w-6 text-indigo-600" strokeWidth={2} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-700">
              Create your first bounty (0% fees)
            </h2>
            <p className="max-w-sm text-base text-slate-500">
              Organise a work contest and outsource that task you&apos;ve been
              dreading since weeks. Zero fees!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Button>Create a Bounty</Button>
          <Button
            variant="ghost"
            asChild
            className="flex items-center gap-3 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-700"
          >
            <Link
              href="https://t.me/pratikdholani/"
              onClick={(e) => {
                e.stopPropagation();
                handleGetHelpClick();
              }}
            >
              <img
                src="/earn/assets/sponsor/pratik.webp"
                alt="Get Help"
                width={28}
                height={28}
              />
              <span>Get Help</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute -right-30 -bottom-42 hidden xl:block">
        <span className="block size-100 rounded-full bg-indigo-100/80" />
      </div>
      <div className="absolute top-2/4 right-10 hidden w-69 -translate-y-1/2 xl:block">
        <img
          src="https://res.cloudinary.com/dgvnuwspr/image/upload/v1763104639/assets/home/sponsor-stages/generate-with-ai.webp"
          alt="Generate bounty with AI"
          className="object-contain object-right"
        />
      </div>
    </Link>
  );
}
