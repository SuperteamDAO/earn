import Link from 'next/link';

import { pageMetadata } from '@/lib/metadata';

import { NotifyOpener } from './notify-opener';

export const metadata = pageMetadata({
  title: 'Superteam Earn',
  description: 'Every Solana opportunity in one place!',
  noIndex: true,
});

// Where a popup sign-in (X verification) lands: it tells the opener how it
// went and closes. Shown only when the window can't close itself.
export default function PopupCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <NotifyOpener />
      <p className="text-center text-sm text-slate-600">
        You can now close this window and return to the original tab.
      </p>
      <Link href="/earn" className="text-primary underline">
        Go to home
      </Link>
    </div>
  );
}
