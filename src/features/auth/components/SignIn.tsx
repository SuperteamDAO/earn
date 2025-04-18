import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { type Dispatch, type SetStateAction } from 'react';
import { MdOutlineEmail } from 'react-icons/md';

import { Button } from '@/components/ui/button';
import { SUPPORT_EMAIL } from '@/constants/project';
import { PRIVACY_POLICY, TERMS_OF_USE } from '@/constants/TERMS_OF_USE';
import { GoogleIcon } from '@/svg/google';

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

  const handleGmailSignIn = async () => {
    posthog.capture('google_auth');
    const callbackUrl = new URL(
      redirectTo || router.asPath,
      window.location.origin,
    );
    callbackUrl.searchParams.set('loginState', 'signedIn');
    if (redirectTo) callbackUrl.searchParams.set('originUrl', router.asPath);
    signIn('google', {
      callbackUrl: callbackUrl.toString(),
    });
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
                >
                  <GoogleIcon />
                  Continue with Google
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
            href={PRIVACY_POLICY}
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
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline hover:text-slate-500"
            target="_blank"
          >
            {SUPPORT_EMAIL}
          </Link>
        </p>
      </div>
    </div>
  );
};
