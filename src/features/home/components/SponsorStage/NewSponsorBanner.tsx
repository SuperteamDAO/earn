import { PenLine } from 'lucide-react';
import Link from 'next/link';
import posthog from 'posthog-js';

import { SponsorStageBannerContent } from './SponsorStageBannerContent';

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
      href="/earn/dashboard/listings?open=1"
      className="relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-100 px-10 py-8"
      onClick={handleCreateBountyClick}
      prefetch={false}
    >
      <SponsorStageBannerContent
        icon={<PenLine className="h-6 w-6 text-indigo-600" strokeWidth={2} />}
        title="Create your first bounty (0% fees)"
        description="Organise a work contest and outsource that task you've been dreading since weeks. Zero fees!"
        ctaLabel="Create a Bounty"
        onGetHelpClick={handleGetHelpClick}
      />

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
