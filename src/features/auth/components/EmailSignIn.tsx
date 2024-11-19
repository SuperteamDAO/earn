import { Button, FormControl, Input, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';

import { validateEmailRegex } from '../utils/email';

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
        // const isValidEmail = await checkEmailValidity(email);
        const isValidEmail = true;
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
            '该电子邮件地址似乎是无效的或需要白名单。请检查并重试。',
          );
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Error during email validation:', error);
        setEmailError(
          '验证您的电子邮件时发生错误。请稍后重试。',
        );
      }
    } else {
      setIsLoading(false);
      setEmailError('请输入有效的电子邮件地址。');
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
          placeholder="输入您的电子邮件地址"
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
        isDisabled={isLoading}
        isLoading={isLoading}
        onClick={handleEmailSignIn}
        size="lg"
      >
        邮箱登录
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
