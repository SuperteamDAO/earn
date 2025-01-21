import { useLoginWithEmail } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { api } from '@/lib/api';
import { cn } from '@/utils/cn';

import { checkEmailValidity, validateEmailRegex } from '../utils/email';

interface LoginProps {
  redirectTo?: string;
}

export const EmailSignIn = ({ redirectTo }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const router = useRouter();
  const posthog = usePostHog();

  const { state, sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: async ({ isNewUser, user }) => {
      if (isNewUser) {
        await api.post('/api/user/create', { email: user.email });
      }
      const url = new URL(redirectTo || router.asPath, window.location.origin);
      url.searchParams.set('loginState', 'signedIn');
      if (redirectTo) url.searchParams.set('originUrl', router.asPath);
      router.push(url.toString());
    },
    onError: () => {
      setEmailError('Authentication failed. Please try again.');
      setIsLoading(false);
    },
  });

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailInput = e.target.value.trim();
    setEmail(emailInput);
    setIsEmailValid(validateEmailRegex(emailInput));
    setEmailError('');
  };

  const handleEmailSignIn = async () => {
    setIsLoading(true);
    setHasAttemptedSubmit(true);
    setEmailError('');

    if (isEmailValid) {
      try {
        const isValidEmail = await checkEmailValidity(email);
        if (isValidEmail) {
          posthog.capture('email OTP_auth');
          localStorage.setItem('emailForSignIn', email);
          await sendCode({ email });
        } else {
          setIsLoading(false);
          setEmailError(
            'This email address appears to be invalid or needs to be whitelisted. Please check and try again.',
          );
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Error during email validation:', error);
        setEmailError(
          'An error occurred while validating your email. Please try again later.',
        );
      }
    } else {
      setIsLoading(false);
      setEmailError('Please enter a valid email address.');
    }
  };

  const handleVerifyOTP = async (value: string) => {
    setIsLoading(true);
    try {
      await loginWithCode({ code: value });
    } catch (error) {
      setEmailError('Invalid code. Please try again.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailSignIn();
    }
  };

  const isError = hasAttemptedSubmit && !isEmailValid;
  const showOTPInput = state.status === 'awaiting-code-input';

  if (showOTPInput) {
    return (
      <div className="mb-20 flex flex-col items-center gap-4">
        <h1 className="text-center text-lg font-medium text-slate-500">
          Enter OTP
        </h1>
        <InputOTP
          maxLength={6}
          onComplete={handleVerifyOTP}
          autoFocus
          inputMode="numeric"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="border-gray-400" />
            <InputOTPSlot index={1} className="border-gray-400" />
            <InputOTPSlot index={2} className="border-gray-400" />
            <InputOTPSlot index={3} className="border-gray-400" />
            <InputOTPSlot index={4} className="border-gray-400" />
            <InputOTPSlot index={5} className="border-gray-400" />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-center text-xs text-slate-400">
          We just sent an OTP on your email <b>{email}</b>
        </p>
        {emailError && (
          <p className="mt-2 text-center text-xs leading-[0.9rem] text-red-500">
            {emailError}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'relative',
          isError && 'has-[input:invalid]:ring-red-500',
        )}
      >
        <Input
          className="h-12 border-slate-300 text-lg"
          onChange={handleEmailChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter Your Email Address"
          value={email}
        />
      </div>
      <Button
        className="ph-no-capture mt-3 h-12 w-full font-medium"
        disabled={isLoading}
        onClick={handleEmailSignIn}
      >
        {isLoading ? 'Loading...' : 'Continue with Email'}
      </Button>
      {emailError && (
        <p className="mt-2 text-center text-xs leading-[0.9rem] text-red-500">
          {emailError}
        </p>
      )}
    </>
  );
};
