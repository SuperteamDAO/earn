import { Box, Button, Flex } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import React from 'react';

export const SignIn = () => {
  return (
    <Box>
      <Flex
        align="center"
        justify="center"
        mb={4}
        color="brand.slate.500"
        fontSize="md"
        textAlign="center"
      >
        <Button onClick={() => signIn('google')}>Sign in with Google</Button>
      </Flex>
    </Box>
  );
};
