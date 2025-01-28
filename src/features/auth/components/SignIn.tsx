import { useLoginWithOAuth } from '@privy-io/react-auth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import { MdOutlineEmail } from 'react-icons/md';

import { Button } from '@/components/ui/button';
import { TERMS_OF_USE } from '@/constants/TERMS_OF_USE';
import { GoogleIcon } from '@/svg/google';

import { handleUserCreation } from '../utils/handleUserCreation';
import { EmailSignIn } from './EmailSignIn';

interface SigninProps {
  loginStep: number;
  setLoginStep: Dispatch<SetStateAction<number>>;
  redirectTo?: string;
}

export const SignIn = ({
  loginStep,
  setLoginStep,
  redirectTo,
}: SigninProps) => {
  const router = useRouter();
  const posthog = usePostHog();
  const [isLoading, setIsLoading] = useState(false);

  const { initOAuth } = useLoginWithOAuth({
    onComplete: async ({ isNewUser, user }) => {
      if (isNewUser) {
        await handleUserCreation(user);
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.replace(router.asPath);
      }
    },
  });

  const handleGmailSignIn = async () => {
    posthog.capture('google_auth');
    setIsLoading(true);
    await initOAuth({ provider: 'google' });
  };

  return (
    <div>
      <div className="px-6">
        <div>
          <div
            className={`transform transition-all duration-200 ${
              loginStep === 0
                ? 'translate-y-0 opacity-100'
                : 'translate-y-5 opacity-0'
            }`}
          >
            {loginStep === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-500">
                <Button
                  className="ph-no-capture h-12 w-full font-medium"
                  size="lg"
                  onClick={handleGmailSignIn}
                  disabled={isLoading}
                >
                  <GoogleIcon />
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                </Button>

                <div className="my-3 flex w-full items-center gap-4">
                  <div className="h-px flex-1 bg-slate-300" />
                  <span className="text-sm text-slate-400">OR</span>
                  <div className="h-px flex-1 bg-slate-300" />
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 w-full bg-white font-medium text-slate-500 hover:bg-slate-100 active:bg-slate-200"
                  onClick={() => setLoginStep(1)}
                >
                  <MdOutlineEmail className="mr-2" />
                  Continue with Email
                </Button>
              </div>
            )}
          </div>

          <div
            className={`transform transition-all duration-200 ${
              loginStep === 1
                ? 'translate-y-0 opacity-100'
                : 'translate-y-5 opacity-0'
            }`}
          >
            {loginStep === 1 && <EmailSignIn redirectTo={redirectTo} />}
          </div>
        </div>

        <p className="mb-2 mt-4 text-center text-xs text-slate-500">
          By using this website, you agree to our{' '}
          <Link
            href={TERMS_OF_USE}
            className="font-semibold hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Use
          </Link>{' '}
          and our{' '}
          <Link
            href={`${router.basePath}/privacy-policy.pdf`}
            className="font-semibold hover:underline"
            target="_blank"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <div className="rounded-b-md bg-slate-100 py-[7px]">
        <p className="text-center text-xs text-slate-400">
          Need help? Reach out to us at{' '}
          <Link
            href="mailto:support@superteamearn.com"
            className="underline hover:text-slate-500"
            target="_blank"
          >
            support@superteamearn.com
          </Link>
        </p>
      </div>
    </div>
  );
};
