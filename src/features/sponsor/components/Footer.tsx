import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { maxW2 } from '../utils/styles';

export function Footer() {
  const { authenticated } = usePrivy();
  const { user } = useUser();
  const posthog = usePostHog();

  function getStartedWhere(isAuthenticated: boolean, isSponsor: boolean) {
    if (!isAuthenticated) return '/new/sponsor';
    if (!isSponsor) return '/new/sponsor';
    return '/dashboard/listings/?open=1';
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-8 rounded-lg bg-indigo-600 leading-tight',
        'mt-12 mb-24',
        'mx-[1.875rem] px-[1.875rem] lg:mx-[7rem] lg:px-[7rem] xl:mx-[11rem] xl:px-[11rem]',
        'py-5 lg:py-8 xl:py-12',
        maxW2,
      )}
    >
      <p
        className={cn(
          'text-center font-semibold text-white',
          'text-[2rem] md:text-[3.5rem]',
        )}
      >
        Where Solana teams come to get sh*t done
      </p>

      <Link
        className="ph-no-capture"
        href={getStartedWhere(authenticated, !!user?.currentSponsorId)}
        onClick={() => posthog.capture('clicked_footer_get_started')}
      >
        <Button
          className={cn(
            'mx-auto h-[3.125rem] w-[12.5rem] px-10',
            'rounded-[0.625rem] text-lg',
            'bg-white text-indigo-600 hover:bg-white/90',
          )}
          variant="ghost"
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
}
