import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface Props {
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
}

export function QueryInput({ loading, query, setQuery }: Props) {
  const { t } = useTranslation();

  return (
    <Box className="ph-no-capture" w="full" maxW="xl" px={{ base: 1, sm: 4 }}>
      <InputGroup border="none">
        <InputLeftElement color="brand.slate.400" pointerEvents="none">
          <SearchIcon aria-label={t('QueryInput.searchIconAlt')} />
        </InputLeftElement>
        <Input
          className="ph-no-capture"
          color="brand.slate.600"
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={500}
          borderColor="brand.slate.300"
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('QueryInput.placeholder')}
          value={query}
          variant="outline"
        />
        <InputRightElement>
          {loading && (
            <Spinner
              aria-label={t('QueryInput.loadingSpinnerAlt')}
              size={'sm'}
            />
          )}
        </InputRightElement>
      </InputGroup>
    </Box>
  );
}
