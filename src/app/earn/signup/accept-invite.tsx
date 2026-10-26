'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  SIGN_IN_GOOGLE,
  SIGN_IN_HEIGHT,
  SIGNED_IN,
} from '@/lib/auth/sign-in-messages';
import { signOut } from '@/lib/auth/sign-out';
import { errorMessage, postJson } from '@/lib/fetch-json';
import { safeNext } from '@/lib/safe-next';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

export function SponsorLogo({ logo, name }: { logo: string; name: string }) {
  return (
    <EarnAvatar className="my-5 size-20 rounded-lg" avatar={logo} id={name} />
  );
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Earn's sign-in form, in the page as Earn showed it: the sign-in page
// framed (Privy loads only there), sized to what it reports.
function EmbeddedSignIn({ next }: { next: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(420);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !isRecord(event.data)
      ) {
        return;
      }
      const data = event.data;
      if (data.type === SIGN_IN_HEIGHT && typeof data.height === 'number') {
        setHeight(Math.min(Math.max(data.height, 200), 800));
      } else if (data.type === SIGNED_IN && typeof data.href === 'string') {
        // A full load, so the page knows who they are.
        window.location.assign(safeNext(data.href));
      } else if (data.type === SIGN_IN_GOOGLE) {
        window.location.assign(
          `/earn/signin/?google=1&next=${encodeURIComponent(next)}`,
        );
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [next]);

  return (
    // Earn's own sign-in page, same origin: Privy needs its scripts and
    // cookies there, which no sandbox would leave.
    // oxlint-disable-next-line react/iframe-missing-sandbox
    <iframe
      ref={frame}
      title="Sign in"
      src={`/earn/signin/?embed=1&heading=0&next=${encodeURIComponent(next)}`}
      className="block w-full border-0"
      style={{ height }}
    />
  );
}

export function GoHome() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push('/earn/')} variant="default">
      Go to Homepage
    </Button>
  );
}

// Signed out: sign in (on its own page) and come back. Signed in as someone
// else: sign out and in as the invited address. Otherwise: accept.
export function AcceptInvite({
  token,
  next,
  signedInEmail,
  invitedEmail,
}: {
  token: string;
  // This page, to come back to once signed in.
  next: string;
  signedInEmail: string | null;
  invitedEmail: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  if (signedInEmail === null) {
    return (
      <div className="mt-6 w-full">
        <p className="mb-4 text-center font-medium text-slate-500">
          Please sign in to accept the invitation:
        </p>
        <EmbeddedSignIn next={next} />
      </div>
    );
  }

  if (signedInEmail.toLowerCase() !== invitedEmail.toLowerCase()) {
    return (
      <div className="mt-16 w-full max-w-md">
        <div className="mt-4">
          <p className="text-center text-sm text-slate-500">
            You&apos;re signed in as{' '}
            <span className="font-medium">{signedInEmail.toLowerCase()}</span>.{' '}
            <br />
            To accept, log out and sign in as{' '}
            <span className="font-medium">{invitedEmail.toLowerCase()}</span>.
          </p>
        </div>
        <div className="mt-4 text-center">
          <Button
            onClick={() => {
              void signOut().finally(() => window.location.assign(next));
            }}
            className="cursor-pointer text-sm text-white hover:underline"
          >
            Log out and continue as {invitedEmail.toLowerCase()}
          </Button>
        </div>
      </div>
    );
  }

  const handleAcceptInvite = async () => {
    setIsPending(true);
    try {
      await postJson('/api/member-invites/accept/', { token });
      toast.success("You've successfully joined the sponsor's dashboard.");
      setIsNavigating(true);
      router.push('/earn/dashboard/listings/');
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to accept invitation'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      className="mt-4"
      disabled={isPending || isNavigating}
      onClick={() => void handleAcceptInvite()}
      size="lg"
    >
      Accept Invite
    </Button>
  );
}
