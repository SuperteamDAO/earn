import { Box, Spinner, Text } from '@chakra-ui/react';

interface Props {
  count: number;
  query: string;
  loading: boolean;
}

export function Info({ count, query, loading }: Props) {
  return (
    <Box px={{ base: 1, sm: 4 }} py={4}>
      <div className="flex gap-2">
        <Text fontSize="sm" fontWeight={600}>
          {query.length === 0
            ? 'Enter a keyword to find what you need.'
            : `Found ${count} search results`}
        </Text>
        {loading && <Spinner size={'sm'} />}
      </div>
      {query.length > 0 && (
        <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
          for {`"${query.trim()}"`}
        </Text>
      )}
    </Box>
  );
}
