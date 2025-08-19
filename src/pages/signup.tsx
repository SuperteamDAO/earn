import { usePrivy } from '@privy-io/react-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { useUser } from '@/store/user';

import { SignIn } from '@/features/auth/components/SignIn';
import {
  acceptInvite,
  verifyInviteQuery,
} from '@/features/sponsor-dashboard/queries/accept-invite';

export default function SignupPage() {
  const [loginStep, setLoginStep] = useState(0);
  const router = useRouter();
  const { authenticated } = usePrivy();
  const [isNavigating, setIsNavigating] = useState(false);
  const { user, refetchUser } = useUser();

  const { invite } = router.query;
  const cleanToken =
    (Array.isArray(invite) ? invite[0] : invite)?.split('?')[0] || '';

  const { data: inviteDetails, error } = useQuery(
    verifyInviteQuery(cleanToken),
  );

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

  useEffect(() => {
    if (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'An error occurred while verifying the invitation',
      );
    }
  }, [error]);

  const isEmailMismatch =
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

  return (
    <div className="container mx-auto flex max-w-xl justify-center">
      <div className="mt-10 w-full rounded-lg border border-gray-200 bg-white px-20 pt-20 pb-40 shadow-lg">
        <div className="flex flex-col items-center">
          <p className="text-center text-2xl font-medium text-slate-600">
            Welcome to Superteam Earn
          </p>
          <p className="text-center text-lg text-slate-600">
            Start your journey to access top global talent!
          </p>

          <div>
            <LocalImage
              className="my-5 block h-20 w-20 rounded"
              alt={inviteDetails?.sponsorName!}
              src={inviteDetails?.sponsorLogo!}
            />
          </div>

          <p className="text-center leading-6 font-medium text-slate-500">
            {inviteDetails?.senderName} has invited you to join <br />
            {inviteDetails?.sponsorName}
          </p>

          {inviteDetails?.invitedEmail && (
            <p className="mt-2 text-center text-sm text-slate-400">
              Invitation sent to:{' '}
              <span className="font-medium">
                {inviteDetails.invitedEmail.toLowerCase()}
              </span>
            </p>
          )}

          <div>
            {!authenticated ? (
              <div className="mt-6 w-full">
                <p className="mb-4 text-center font-medium text-slate-500">
                  Please sign in to accept the invitation:
                </p>
                <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
              </div>
            ) : isEmailMismatch ? (
              <div className="mt-6 w-full max-w-md">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <p className="text-center text-sm font-medium text-orange-800">
                    Email Mismatch
                  </p>
                  <p className="mt-2 text-center text-sm text-orange-700">
                    You&apos;re signed in as{' '}
                    <span className="font-medium">
                      {user?.email?.toLowerCase()}
                    </span>
                    , but this invitation was sent to{' '}
                    <span className="font-medium">
                      {inviteDetails?.invitedEmail?.toLowerCase()}
                    </span>
                    .
                  </p>
                  <p className="mt-2 text-center text-sm text-orange-700">
                    Please sign in with the correct email to accept this
                    invitation.
                  </p>
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
