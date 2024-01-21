import {
  Box,
  Circle,
  Flex,
  Heading,
  Image,
  Link,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import EmailIcon from '@/svg/email';

export default function VerifyRequest() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('emailForSignIn');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);
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
      <Flex align="center" justify="center" direction="column" h="60vh">
        <Heading mt={16} color="#1E293B" fontSize={'28'} textAlign={'center'}>
          We sent you a magic link
        </Heading>
        <Text color="#475569" fontSize="20" textAlign={'center'}>
          On your email {email}
        </Text>
        <Circle mx="auto" mt={16} bg="#EEF2FF" size={32}>
          <EmailIcon />
        </Circle>
        <Text mt={12} color="#475569" fontSize="18" textAlign={'center'}>
          Please click on the link to verify your email
        </Text>
      </Flex>
    </>
  );
}
