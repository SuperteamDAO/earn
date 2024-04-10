import { Button, Text, VStack } from '@chakra-ui/react';

import { fontSize, padding } from '../utils';

export function Footer() {
  return (
    <VStack
      gap={8}
      mx={padding}
      mt={'3rem'}
      mb="6rem"
      px={padding}
      py={{ base: '1.275rem', lg: '2rem', xl: '3rem' }}
      lineHeight={1.2}
      bg="#4F46E5"
      rounded="0.5rem"
    >
      <Text
        color="white"
        fontSize={fontSize}
        fontWeight={600}
        textAlign={'center'}
      >
        Where Solana teams come to get sh*t done
      </Text>
      <Button px={'2.5rem'} color="#4F46E5" fontSize={'1.2rem'} bg="white">
        Get Started
      </Button>
    </VStack>
  );
}
