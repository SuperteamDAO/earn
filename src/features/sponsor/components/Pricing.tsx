import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

import { maxW } from '../utils/styles';

interface PricingItem {
  readonly label: string;
  readonly value: string;
}

const PRICING_ITEMS: readonly PricingItem[] = [
  { label: 'Twitter Thread', value: '$500 - $1,500' },
  { label: 'Deep Dive / Long Form Essay', value: '$500 - $1,000' },
  { label: 'Hype Video Production', value: '$1,000 - $2,000' },
  { label: 'Build Apps with SDK', value: '$2,000 - $3,000' },
  { label: 'Telegram Bot', value: '$1,500 - $2,500' },
  { label: 'Logo Design', value: '$750 - $1,000' },
  { label: 'Analytics Dashboard', value: '$1,500 to $2,000' },
  { label: 'Landing Page Developement', value: '$2,000 to $3,000' },
] as const;

export function Pricing() {
  return (
    <section
      id="pricing"
      className={cn(
        'mb-10 flex w-full items-center justify-center',
        maxW,
        'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
      )}
    >
      <div className="flex w-full flex-col overflow-hidden rounded-xl">
        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-2 md:gap-12 md:divide-x md:divide-slate-200 md:p-10 md:pt-12">
          <div className="flex flex-col items-center justify-start text-center md:items-start">
            <h2 className="mb-6 text-[1.8rem] leading-[1.1] font-semibold text-slate-800 sm:text-[2rem]">
              Pricing
            </h2>

            <p className="mx-auto mt-8 mb-2 text-[4rem] leading-none font-semibold text-slate-600 sm:text-[4.5rem]">
              0%
            </p>
            <p className="mx-auto mb-6 text-center text-lg text-slate-500">
              No commission. At all.
            </p>

            <Link href="/new/sponsor" className="ph-no-capture mx-auto mt-8">
              <Button
                className="h-[2.5rem] w-[8.5rem] rounded-[0.4rem] bg-indigo-600 text-sm font-medium text-white md:h-[3.125rem] md:w-[12.5rem] md:text-lg"
                variant="default"
              >
                Post for Free
              </Button>
            </Link>
          </div>

          <div className="md:pl-12">
            <p className="max-w-[40rem] text-[0.95rem] leading-6 text-slate-600">
              There are no listing fees, but here’s the average rate card for
              total rewards/compensation for different types of work.{' '}
              <Link
                href="https://docs.google.com/spreadsheets/d/18Pahc-_9WhXezz7DW2kjwE1Iu-ExbOFtoxlPPsavsvg/edit?gid=0#gid=0"
                className="font-medium text-indigo-500 underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Rates ↗
              </Link>
            </p>

            <ul className="mt-6 space-y-3 sm:mt-8">
              {PRICING_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-6 text-slate-700"
                >
                  <span className="text-[0.95rem] sm:text-[1rem]">
                    {item.label}
                  </span>
                  <span className="text-[0.95rem] font-medium text-slate-800 sm:text-[1rem]">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
