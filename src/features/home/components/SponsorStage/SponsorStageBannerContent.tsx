import Link from 'next/link';
import { type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { JTTG } from '@/constants/Telegram';

interface SponsorStageBannerContentProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  descriptionMaxWidth?: 'max-w-sm' | 'max-w-md';
  ctaLabel: string;
  onGetHelpClick: () => void;
}

export function SponsorStageBannerContent({
  icon,
  title,
  description,
  descriptionMaxWidth = 'max-w-sm',
  ctaLabel,
  onGetHelpClick,
}: SponsorStageBannerContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg">
          {icon}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-slate-700">{title}</h2>
          <p className={`${descriptionMaxWidth} text-base text-slate-500`}>
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <Button>{ctaLabel}</Button>
        <Button
          variant="ghost"
          asChild
          className="flex items-center gap-3 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-700"
        >
          <Link
            href={JTTG}
            onClick={(e) => {
              // The whole banner is a link; keep this click from also
              // triggering the banner's navigation and CTA tracking.
              e.stopPropagation();
              onGetHelpClick();
            }}
          >
            <img
              src="/assets/sponsor/jill.png"
              alt="Get Help"
              width={28}
              height={28}
            />
            <span>Get Help</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
