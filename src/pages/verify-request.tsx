import {
  Box,
  Circle,
  Flex,
  Heading,
  Image,
  Link,
  PinInput,
  PinInputField,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { EmailIcon } from '@/svg/email';

export default function VerifyRequest() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('emailForSignIn');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const verifyOTP = (value: string) => {
    const token = value.trim();
    const encodedEmail = encodeURIComponent(email);
    const apiUrl = `/api/auth/callback/email?token=${token}&email=${encodedEmail}`;
    router.push(apiUrl);
  };

  return (
    <>
      <Box py={3} borderBottomWidth={2}>
        <Link as={NextLink} mx="auto" href="/">
          <Image
            h={6}
            mx="auto"
            cursor="pointer"
            objectFit={'contain'}
            alt={'Superteam Earn'}
            onClick={() => {
              router.push('/');
            }}
            src={'/assets/logo/logo.svg'}
          />
        </Link>
      </Box>
      <Flex align="center" justify="center" direction="column" h="60vh" px={3}>
        <Heading
          mt={16}
          color="#1E293B"
          fontSize={{ base: '2xl', md: '28' }}
          textAlign={'center'}
        >
          We just sent an OTP
        </Heading>
        <Text
          color="#475569"
          fontSize={{ base: 'lg', md: '20' }}
          textAlign={'center'}
        >
          On your email {email}
        </Text>
        <Circle mx="auto" my={16} bg="#EEF2FF" size={32}>
          <EmailIcon />
        </Circle>
        <Flex gap={1.5}>
          <PinInput
            autoFocus
            colorScheme="purple"
            focusBorderColor="brand.purple"
            onComplete={verifyOTP}
            otp
            size={'lg'}
          >
            <PinInputField borderColor={'gray.400'} />
            <PinInputField borderColor={'gray.400'} />
            <PinInputField borderColor={'gray.400'} />
            <PinInputField borderColor={'gray.400'} />
            <PinInputField borderColor={'gray.400'} />
            <PinInputField borderColor={'gray.400'} />
          </PinInput>
        </Flex>
      </Flex>
    </>
  );
}
