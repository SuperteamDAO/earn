import { Box, HStack, Spinner, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface Props {
  count: number;
  query: string;
  loading: boolean;
}

export function Info({ count, query, loading }: Props) {
  const { t } = useTranslation();

  return (
    <Box px={{ base: 1, sm: 4 }} py={4}>
      <HStack>
        <Text fontSize="sm" fontWeight={600}>
          {query.length === 0
            ? t('search.enterKeyword')
            : t('search.resultsFound', { count })}
        </Text>
        {loading && <Spinner size={'sm'} />}
      </HStack>
      {query.length > 0 && (
        <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
          {t('search.for', { query: query.trim() })}
        </Text>
      )}
    </Box>
  );
}
