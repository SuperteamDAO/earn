'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useViewer } from '@/lib/viewer';

// Pages a viewer without a profile may stay on.
const PROFILE_EXEMPT = ['/earn/new', '/earn/sponsor', '/earn/signup'];

// Where the shell sends a viewer, done where the path is known:
// - a blocked account to /earn/blocked/ (Earn's useUser did this);
// - an account with neither a talent profile nor a sponsor to finish its
//   profile, coming back here after (Earn's useForcedProfileRedirect).
export function ShellRedirects() {
  const viewer = useViewer();
  const blocked = !!viewer?.isBlocked;
  const needsProfile =
    !!viewer && !viewer.isTalentFilled && !viewer.currentSponsorId;
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const search = useSearchParams()?.toString() ?? '';

  useEffect(() => {
    if (blocked) {
      if (!pathname.startsWith('/earn/blocked')) {
        router.replace('/earn/blocked/');
      }
      return;
    }
    if (
      !needsProfile ||
      PROFILE_EXEMPT.some((path) => pathname.startsWith(path))
    ) {
      return;
    }
    const origin = search ? `${pathname}?${search}` : pathname;
    router.replace(
      `/earn/new/?type=forced&originUrl=${encodeURIComponent(origin)}`,
    );
  }, [blocked, needsProfile, pathname, search, router]);

  return null;
}
