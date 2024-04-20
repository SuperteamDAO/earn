import { Box, HStack, Text } from '@chakra-ui/react';
import { LoaderIcon } from 'react-hot-toast';

interface Props {
  count: number;
  query: string;
  loading: boolean;
}

export function Info({ count, query, loading }: Props) {
  return (
    <Box px={{ base: 1, sm: 4 }} py={4}>
      <HStack>
        <Text fontSize="sm" fontWeight={600}>
          Found {count} search results
        </Text>
        {loading && <LoaderIcon />}
      </HStack>
      <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
        for {`"${query.trim()}"`}
      </Text>
    </Box>
  );
}
