import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  Input,
  Link,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import { MdOutlineEmail } from 'react-icons/md';

import { GoogleIcon } from '@/svg/google';

export const SignIn = ({
  loginStep,
  setLoginStep,
}: {
  loginStep: number;
  setLoginStep: Dispatch<SetStateAction<number>>;
}) => {
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const router = useRouter();

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
      signIn('email', {
        email,
        callbackUrl: `${router.asPath}?loginState=signedIn`,
      });
    }
  };

  const isError = hasAttemptedSubmit && !isEmailValid;

  return (
    <>
      <Box>
        <Box px={6}>
          <Box>
            {loginStep === 0 && (
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
                  fontSize="17px"
                  fontWeight={500}
                  leftIcon={<GoogleIcon />}
                  onClick={() =>
                    signIn('google', {
                      callbackUrl: `${router.asPath}?loginState=signedIn`,
                    })
                  }
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
                <Button
                  w="100%"
                  h="2.9rem"
                  color="brand.slate.500"
                  fontSize="17px"
                  fontWeight={500}
                  bg="#fff"
                  borderWidth="1px"
                  borderColor="#CBD5E1"
                  _hover={{ bg: 'brand.slate.100' }}
                  _active={{ bg: 'brand.slate.200' }}
                  leftIcon={<MdOutlineEmail />}
                  onClick={() => setLoginStep(1)}
                  size="lg"
                >
                  Continue with Email
                </Button>
              </Flex>
            )}
            {loginStep === 1 && (
              <>
                <FormControl isInvalid={isError}>
                  <Input
                    fontSize={'16px'}
                    borderColor="#CBD5E1"
                    _placeholder={{ fontSize: '16px' }}
                    onChange={handleEmailChange}
                    placeholder="Enter Your Email Address"
                    size="lg"
                    value={email}
                  />
                </FormControl>
                <Button
                  w="100%"
                  h="2.9rem"
                  mt={3}
                  fontSize="17px"
                  fontWeight={500}
                  onClick={handleEmailSignIn}
                  size="lg"
                >
                  Continue with Email
                </Button>
              </>
            )}
          </Box>
          <Text
            mt={4}
            mb={2}
            color="brand.slate.500"
            fontSize="xs"
            textAlign="center"
          >
            By using this website, you agree to our{' '}
            <Link
              as={NextLink}
              fontWeight={600}
              href={`${router.basePath}/terms-of-service.pdf`}
              isExternal
            >
              Terms of Service
            </Link>{' '}
            and our{' '}
            <Link
              as={NextLink}
              fontWeight={600}
              href={`${router.basePath}/privacy-policy.pdf`}
              isExternal
            >
              Privacy Policy
            </Link>
            .
          </Text>
        </Box>
        <Box
          flexDir={'column'}
          py={'6px'}
          bg={'brand.slate.100'}
          borderBottomRadius="6px"
        >
          <Text color="brand.slate.500" fontSize="xs" textAlign="center">
            Trouble Logging in?{' '}
            <Text as="u">
              <Link
                as={NextLink}
                href={'mailto:hello@superteamearn.com'}
                isExternal
              >
                Click here
              </Link>
            </Text>
          </Text>
        </Box>
      </Box>
    </>
  );
};
