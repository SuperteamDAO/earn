'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/sign-out';
import { errorMessage, postJson } from '@/lib/fetch-json';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

export function SponsorLogo({ logo, name }: { logo: string; name: string }) {
  return (
    <EarnAvatar className="my-5 size-20 rounded-lg" avatar={logo} id={name} />
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
  signIn,
  signedInEmail,
  invitedEmail,
}: {
  token: string;
  signIn: string;
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
        <div className="text-center">
          {/* Plain <a>: sign-in is a Privy document with its own CSP. */}
          <Button asChild size="lg" className="ph-no-capture">
            <a href={signIn}>Sign in</a>
          </Button>
        </div>
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
              void signOut().finally(() => window.location.assign(signIn));
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
