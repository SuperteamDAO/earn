import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import posthog from 'posthog-js';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

export function CallOut() {
  const { authenticated } = usePrivy();
  const { user } = useUser();

  function getStartedWhere(
    isAuthenticated: boolean,
    isSponsor: boolean,
  ): string {
    if (!isAuthenticated) return '/new/sponsor';
    if (!isSponsor) return '/new/sponsor';
    return '/dashboard/listings/?open=1';
  }

  return (
    <section
      className={cn(
        'relative mx-auto w-full overflow-hidden bg-slate-900 px-4 py-16 text-center md:py-24 xl:py-52',
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
      >
        <ExternalImage
          alt="Earth map"
          src={'/landingsponsor/icons/earth-map.webp'}
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[140%] max-w-none md:w-3/5',
          )}
          decoding="async"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1020]/30 via-transparent to-[#0B1020]/60" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[46rem] flex-col items-center gap-6">
        <h2 className="text-[2rem] leading-[1.1] font-semibold text-white md:text-[3.25rem]">
          Ship Faster With 150K
          <br className="hidden sm:block" />
          Solana Freelancers
        </h2>

        <div className="flex w-full justify-center">
          <Link
            className="ph-no-capture"
            href={getStartedWhere(authenticated, !!user?.currentSponsorId)}
            onClick={() => posthog?.capture('clicked_callout_get_started')}
          >
            <Button className="h-[3.125rem] w-[12.5rem] rounded-[0.4rem] bg-indigo-600 text-lg font-medium text-white">
              Post for Free 🙌
              <span className="ml-2">→</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
