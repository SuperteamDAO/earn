import { Button, Text, VStack } from '@chakra-ui/react';

export function Footer() {
  return (
    <VStack
      gap={8}
      mx={{ base: '1.875rem', lg: '7rem', xl: '11rem' }}
      mt={'3rem'}
      mb="6rem"
      px={{ base: '1.875rem', lg: '7rem', xl: '11rem' }}
      py={{ base: '1.275rem', lg: '2rem', xl: '3rem' }}
      lineHeight={1.2}
      bg="#4F46E5"
      rounded="0.5rem"
    >
      <Text
        color="white"
        fontSize={{ base: '2rem', md: '3.5rem' }}
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
