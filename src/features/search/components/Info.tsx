import { Box, Text } from '@chakra-ui/react';

interface Props {
  count: number;
  query: string;
}

export function Info({ count, query }: Props) {
  return (
    <Box px={{ base: 1, sm: 4 }} py={4}>
      <Text fontSize="sm" fontWeight={600}>
        Found {count} search results
      </Text>
      <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
        for {`"${query.trim()}"`}
      </Text>
    </Box>
  );
}
