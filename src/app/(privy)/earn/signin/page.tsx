import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { safeNext } from '@/lib/safe-next';

import { PrivyAuthProvider } from '../../privy-auth-provider';
import { privyProps } from '../../privy-props';
import { LoginPanel } from './login-panel';
import { RenewFrame } from './renew-frame';
import { SignOutFrame } from './sign-out-frame';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
};

// The one page that signs people in, and the only public way into Privy's
// SDK (besides the wallet). Public pages send signed-out visitors here with
// `?next=`; it also serves two hidden frames that renew or end the session
// for public pages, which load no Privy code.
export default async function SignInPage({
  searchParams,
}: PageProps<'/earn/signin'>) {
  const {
    next,
    privy_oauth_code,
    renew,
    'sign-out': signOut,
    embed,
    google,
    heading,
  } = await searchParams;
  const privy = await privyProps();
  // A public page renewing the session in a hidden frame; nothing to show.
  if (renew === '1') {
    return (
      <PrivyAuthProvider {...privy}>
        <RenewFrame />
      </PrivyAuthProvider>
    );
  }
  // A public page signing them out in a hidden frame; likewise.
  if (signOut === '1') {
    return (
      <PrivyAuthProvider {...privy}>
        <SignOutFrame />
      </PrivyAuthProvider>
    );
  }
  // Privy will likely sign them in unprompted (`privy-session` hints at a
  // refresh token), so start on the spinner rather than the form.
  const expectingSession =
    (await cookies()).has('privy-session') ||
    typeof privy_oauth_code === 'string';
  const panel = (
    <LoginPanel
      privy={privy}
      next={safeNext(typeof next === 'string' ? next : null)}
      expectingSession={expectingSession}
      embed={embed === '1'}
      google={google === '1'}
      // `heading=0`: framed under the page's own heading.
      heading={!(embed === '1' && heading === '0')}
    />
  );
  // Framed by Earn's sign-in dialog (src/lib/auth/sign-in-dialog.tsx): just
  // the card's content; the dialog is the card.
  if (embed === '1') return panel;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      {panel}
    </main>
  );
}
