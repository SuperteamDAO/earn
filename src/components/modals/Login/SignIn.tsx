import { Box, Button, Flex, Input } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import React, { useState } from 'react';

export const SignIn = () => {
  const [email, setEmail] = useState('');

  const handleEmailSignIn = () => {
    localStorage.setItem('emailForSignIn', email); // Save email to localStorage
    signIn('email', { email });
  };

  return (
    <Box>
      <Flex
        align="center"
        justify="center"
        direction={'column'}
        gap={2}
        mb={4}
        color="brand.slate.500"
        fontSize="md"
        textAlign="center"
      >
        <Button w="100%" mt={4} onClick={() => signIn('google')}>
          Sign in with Google
        </Button>
        <Input
          mt={6}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          value={email}
        />
        <Button w="100%" onClick={handleEmailSignIn}>
          Sign in with Email
        </Button>
      </Flex>
    </Box>
  );
};
