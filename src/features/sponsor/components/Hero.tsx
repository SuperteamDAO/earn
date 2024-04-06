import { Button, Flex, Text, VStack } from '@chakra-ui/react';

import { StepOne } from './steps/One';

export function Hero() {
  return (
    <>
      <VStack align="center" justify="start" overflow="hidden" w="100%">
        <Flex
          align="center"
          gap="1.875rem"
          w={{ base: '100%' }}
          px="1.875rem"
          pt="9.375rem"
          textAlign="center"
          bg="#F8FAFC"
          flexFlow="column"
        >
          <Text
            color="gray.700"
            fontFamily="var(--font-sans)"
            fontSize={{ base: '2rem' }}
            fontWeight={'600'}
            lineHeight="1.15em"
            letterSpacing={'-0.04em'}
          >
            Where Solana teams come to get sh*t done
          </Text>
          <Text
            w="100%"
            color="gray.500"
            fontSize={{ base: '1.25rem' }}
            fontWeight={500}
            css={{
              textWrap: 'pretty',
            }}
          >
            The world’s best Solana talent is on Superteam Earn. Get work done
            from the right people, at the right time.
          </Text>

          <Flex justify="start" gap="2rem" w="100%">
            <Button
              w="12.5rem"
              h="3.125rem"
              mx="auto"
              color={'white'}
              fontSize="1.125rem"
              bg={'#6562FF'}
              borderRadius="0.625rem"
              onClick={() => {
                window.location.href = '/new/sponsor';
              }}
              variant={'solid'}
            >
              Get Started
            </Button>
          </Flex>
        </Flex>
        <Flex>
          <StepOne />
        </Flex>
      </VStack>
    </>
  );
}
