import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  Input,
  Text,
} from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import React, { useState } from 'react';

import GoogleIcon from '@/svg/google';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const validateEmail = (emailAddress: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailAddress);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emailInput = e.target.value;
    setEmail(emailInput);
    setIsEmailValid(validateEmail(emailInput));
  };

  const handleEmailSignIn = () => {
    setHasAttemptedSubmit(true);
    if (isEmailValid) {
      localStorage.setItem('emailForSignIn', email);
      signIn('email', { email });
    }
  };

  const isError = hasAttemptedSubmit && !isEmailValid;

  return (
    <Box>
      <Flex
        align="center"
        justify="center"
        direction={'column'}
        gap={2}
        color="brand.slate.500"
        fontSize="md"
        textAlign="center"
      >
        <Button
          w="100%"
          color="brand.slate.700"
          fontSize="17px"
          fontWeight={500}
          bg="#fff"
          borderWidth="1px"
          borderColor="#CBD5E1"
          _hover={{ bg: 'brand.slate.100' }}
          _active={{ bg: 'brand.slate.200' }}
          leftIcon={<GoogleIcon />}
          onClick={() => signIn('google')}
          size="lg"
        >
          Continue with Google
        </Button>
        <Flex align={'center'} gap={4} w="100%" my={3}>
          <Divider borderColor={'brand.slate.300'} />{' '}
          <Text color={'brand.slate.400'} fontSize="14px">
            OR
          </Text>{' '}
          <Divider borderColor={'brand.slate.300'} />
        </Flex>
        <FormControl isInvalid={isError}>
          <Input
            fontSize={'16px'}
            borderColor="#CBD5E1"
            _placeholder={{ fontSize: '16px' }}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            size="lg"
            value={email}
          />
        </FormControl>
        <Button
          w="100%"
          h="2.9rem"
          mt={1}
          fontSize="17px"
          fontWeight={500}
          onClick={handleEmailSignIn}
          size="lg"
        >
          Continue with Email
        </Button>
      </Flex>
    </Box>
  );
};
