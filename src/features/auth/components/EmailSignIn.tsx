import { Button, FormControl, Input, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';

import { checkEmailValidity, validateEmailRegex } from '../utils/email';

export const EmailSignIn = () => {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [hasGmail, setHasGmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const router = useRouter();
  const posthog = usePostHog();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailInput = e.target.value;
    setEmail(emailInput);
    setIsEmailValid(validateEmailRegex(emailInput));
    setHasGmail(emailInput.includes('@gmail.com'));
    setEmailError('');
  };

  const hasGmailAndIsProd =
    hasGmail && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

  const handleEmailSignIn = async () => {
    setIsLoading(true);
    setHasAttemptedSubmit(true);
    setEmailError('');

    if (isEmailValid && !hasGmailAndIsProd) {
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
            'This email address appears to be invalid. Please check and try again.',
          );
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Error during email validation:', error);
        setEmailError(
          'An error occurred while validating your email. Please try again later.',
        );
      }
    } else if (hasGmailAndIsProd) {
      setIsLoading(false);
      setEmailError(
        'Please use the Google Auth login option for Gmail addresses.',
      );
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
      <FormControl isInvalid={isError}>
        <Input
          fontSize={'16px'}
          borderColor="#CBD5E1"
          _placeholder={{ fontSize: '16px' }}
          onChange={handleEmailChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter Your Email Address"
          size="lg"
          value={email}
        />
      </FormControl>
      <Button
        className="ph-no-capture"
        w="100%"
        h="2.9rem"
        mt={3}
        fontSize="17px"
        fontWeight={500}
        cursor={hasGmailAndIsProd ? 'not-allowed' : 'pointer'}
        isDisabled={hasGmailAndIsProd || isLoading}
        isLoading={isLoading}
        onClick={handleEmailSignIn}
        size="lg"
      >
        Continue with Email
      </Button>
      {emailError && (
        <Text
          align={'center'}
          mt={2}
          color="red.500"
          fontSize={'xs'}
          lineHeight={'0.9rem'}
        >
          {emailError}
        </Text>
      )}
    </>
  );
};
