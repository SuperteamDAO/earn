'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// The winners link is for sharing: its card image is the point. People who
// open it go on to the listing, as on Earn.
export function ToListing({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.push(href);
  }, [href, router]);
  return null;
}
