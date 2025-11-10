import { HandCoins, Megaphone, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function SponsorResources() {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
        RESOURCES
      </span>

      <div className="flex flex-col gap-4">
        <Link href="#" className="flex items-start gap-4">
          <div className="flex h-14 w-18 flex-shrink-0 items-center justify-center rounded-md bg-[#E7D3FF]">
            <Sparkles className="h-6 w-6 text-[#321D89]" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="text-sm font-medium text-slate-600">
              Getting Started
            </h3>
            <p className="text-sm leading-[1.2] text-slate-500">
              A quick start guide to creating your first Bounty or Project
              listing
            </p>
          </div>
        </Link>

        <Link
          href="https://docs.google.com/spreadsheets/d/18Pahc-_9WhXezz7DW2kjwE1Iu-ExbOFtoxlPPsavsvg/edit?gid=0#gid=0"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4"
        >
          <div className="flex h-14 w-18 flex-shrink-0 items-center justify-center rounded-md bg-[#C5EAFF]">
            <HandCoins className="h-6 w-6 text-[#15457B]" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="text-sm font-medium text-slate-600">Rate Card</h3>
            <p className="text-sm leading-[1.2] text-slate-500">
              Understand how to price your opportunities on Earn
            </p>
          </div>
        </Link>

        <Link href="/dashboard/faq" className="flex items-start gap-4">
          <div className="flex h-14 w-18 flex-shrink-0 items-center justify-center rounded-md bg-[#BCDDFF]">
            <Megaphone className="h-6 w-6 text-[#413762]" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="text-sm font-medium text-slate-600">FAQ</h3>
            <p className="text-sm leading-[1.2] text-slate-500">
              Got a question? Its probably answered in our FAQ already
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
