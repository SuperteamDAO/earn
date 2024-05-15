import { Text, VStack } from '@chakra-ui/react';

export function ComingSoon() {
  return (
    <VStack align="start" p={6} fontSize={'sm'} bg="#F0F9FF" rounded={12}>
      <Text fontWeight={600}>Coming Soon... </Text>
      <Text color="brand.slate.500">
        We’re actively looking at ways of rewarding the top contributors.{' '}
        <strong>Not through a token or points, </strong> but with real, tangible
        benefits for people above a certain rank.
      </Text>
    </VStack>
  );
}
