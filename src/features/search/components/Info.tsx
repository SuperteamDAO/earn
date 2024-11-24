import { Box, HStack, Spinner, Text } from '@chakra-ui/react';

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
          {query.length === 0
            ? '请输入关键字'
            : `发现 ${count} 条`}
        </Text>
        {loading && <Spinner size={'sm'} />}
      </HStack>
      {query.length > 0 && (
        <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
          关于{`"${query.trim()}"`} 的搜索结果
        </Text>
      )}
    </Box>
  );
}
