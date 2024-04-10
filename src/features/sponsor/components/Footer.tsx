import { Button, Text, VStack } from '@chakra-ui/react';

import { fontSize, maxW2, padding } from '../utils';

export function Footer() {
  return (
    <VStack
      gap={8}
      maxW={maxW2}
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
      <Button
        w="12.5rem"
        h="3.125rem"
        mx="auto"
        px={'2.5rem'}
        color="#4F46E5"
        fontSize="1.125rem"
        bg="white"
        borderRadius="0.625rem"
        variant={'solid'}
      >
        Get Started
      </Button>
    </VStack>
  );
}
