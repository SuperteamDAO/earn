import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

import { checkEmailValidity, validateEmailRegex } from '../utils/email';

export const EmailSignIn = () => {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const router = useRouter();
  const posthog = usePostHog();

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
          signIn('email', {
            email,
            callbackUrl: `${router.asPath}?loginState=signedIn`,
          });
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailSignIn();
    }
  };

  const isError = hasAttemptedSubmit && !isEmailValid;

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
