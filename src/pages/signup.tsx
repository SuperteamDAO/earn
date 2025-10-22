'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';

import { SignIn } from '@/features/auth/components/SignIn';
import {
  acceptInvite,
  verifyInviteQuery,
} from '@/features/sponsor-dashboard/queries/accept-invite';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

export default function SignupPage() {
  const [loginStep, setLoginStep] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, logout, ready } = usePrivy();
  const [isNavigating, setIsNavigating] = useState(false);
  const { user, refetchUser } = useUser();

  const invite = searchParams?.get('invite');
  const cleanToken = invite?.split('?')[0] || '';

  const {
    data: inviteDetails,
    error,
    isPending,
  } = useQuery(verifyInviteQuery(cleanToken));

  const acceptInviteMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: async () => {
      toast.success("You've successfully joined the sponsor's dashboard.");
      await refetchUser();
      setIsNavigating(true);
      router.push('/dashboard/listings');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAcceptInvite = () => {
    acceptInviteMutation.mutate(cleanToken);
  };

  const isEmailMismatch =
    ready &&
    authenticated &&
    user?.email &&
    inviteDetails?.invitedEmail &&
    user.email.toLowerCase() !== inviteDetails.invitedEmail.toLowerCase();

  if (error) {
    return (
      <div className="container flex justify-center">
        <div className="mt-10 flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Invitation Error</h1>
          <p>{error instanceof Error ? error.message : 'An error occurred'}</p>
          <Button onClick={() => router.push('/')} variant="default">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (!ready || isPending) {
    return (
      <div className="container mx-auto flex max-w-xl justify-center">
        <div className="mt-10 w-full rounded-lg border border-gray-200 bg-white px-20 pt-20 pb-40 shadow-lg">
          <div className="flex flex-col items-center">
            <p className="text-center text-2xl font-semibold text-slate-600">
              Welcome to Superteam Earn
            </p>
            <p className="text-center text-lg text-slate-400">
              Start your journey to access top global talent!
            </p>
            <div className="mt-8 text-center text-slate-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex max-w-xl justify-center">
      <div className="mt-10 w-full rounded-lg border border-gray-200 bg-white px-20 pt-20 pb-40 shadow-lg">
        <div className="flex flex-col items-center">
          <p className="text-center text-2xl font-semibold text-slate-600">
            Welcome to Superteam Earn
          </p>
          <p className="mb-6 text-center text-lg text-slate-400">
            Start your journey to access top global talent!
          </p>

          {inviteDetails?.sponsorLogo && inviteDetails?.sponsorName ? (
            <div>
              <EarnAvatar
                className="my-5 size-20 rounded-lg"
                avatar={inviteDetails.sponsorLogo}
                id={inviteDetails.sponsorName}
              />
            </div>
          ) : null}

          <p className="text-center text-xl font-medium text-slate-800">
            {inviteDetails?.senderName} has invited you to join{' '}
            <span className="font-bold">{inviteDetails?.sponsorName}</span>
          </p>

          <div>
            {!authenticated ? (
              <div className="mt-6 w-full">
                <p className="mb-4 text-center font-medium text-slate-500">
                  Please sign in to accept the invitation:
                </p>
                <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
              </div>
            ) : isEmailMismatch ? (
              <div className="mt-16 w-full max-w-md">
                <div className="mt-4">
                  <p className="text-center text-sm text-slate-500">
                    You&apos;re signed in as{' '}
                    <span className="font-medium">
                      {user?.email?.toLowerCase()}
                    </span>
                    . <br />
                    To accept, log out and sign in as{' '}
                    <span className="font-medium">
                      {inviteDetails?.invitedEmail?.toLowerCase()}
                    </span>
                    .
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <Button
                    onClick={async () => {
                      try {
                        await logout();
                        router.push(`/signup?invite=${cleanToken}`);
                      } catch (error) {
                        router.push(`/signup?invite=${cleanToken}`);
                      }
                    }}
                    className="cursor-pointer text-sm text-white hover:underline"
                  >
                    Log out and continue as{' '}
                    {inviteDetails?.invitedEmail?.toLowerCase()}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="mt-4"
                disabled={
                  !inviteDetails ||
                  acceptInviteMutation.isPending ||
                  isNavigating
                }
                onClick={handleAcceptInvite}
                size="lg"
              >
                Accept Invite
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
