import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';

import { Button } from '@/components/ui/button';
import { CHAIN_NAME } from '@/constants/project';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { maxW2 } from '../utils/styles';

export function Footer() {
  const { data: session } = useSession();

  const { user } = useUser();

  const posthog = usePostHog();

  function getStartedWhere(authenticated: boolean, isSponsor: boolean) {
    if (!authenticated) return '/new/sponsor';
    if (!isSponsor) return '/new/sponsor';
    return '/dashboard/listings/?open=1';
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-8 rounded-lg bg-indigo-600 leading-tight',
        'mb-24 mt-12',
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
        Where {CHAIN_NAME} teams come to get sh*t done
      </p>

      <Link
        className="ph-no-capture"
        href={getStartedWhere(!!session, !!user?.currentSponsorId)}
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
