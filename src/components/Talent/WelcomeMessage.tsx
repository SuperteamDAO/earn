import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';

export function WelcomeMessage({ setStep }: { setStep: () => void }) {
  return (
    <Flex align="center" justify="center" minH={'92vh'}>
      <Box w={'xl'}>
        <VStack>
          <Heading
            color={'#334254'}
            fontFamily={'var(--font-sans)'}
            fontSize={'1.5rem'}
            fontWeight={700}
          >
            Welcome to Superteam Earn
          </Heading>
          <Text
            color={'gray.400'}
            fontFamily={'var(--font-sans)'}
            fontSize={'1.25rem'}
            fontWeight={500}
            textAlign={'center'}
          >
            A message from Kash
          </Text>
        </VStack>
        <Flex w={'34.375rem'} h={'16.9375rem'} mt={6} borderRadius={'7px'}>
          <Image
            w={'100%'}
            h={'100%'}
            alt=""
            src={'/assets/bg/vid-placeholder.png'}
          />
        </Flex>
        <Button
          w="full"
          mt={6}
          onClick={() => setStep()}
          size="lg"
          variant="solid"
        >
          Let&apos;s get started!
        </Button>
      </Box>
    </Flex>
  );
}
