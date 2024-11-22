import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
} from '@chakra-ui/react';

interface Props {
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
}

export function QueryInput({ loading, query, setQuery }: Props) {
  return (
    <Box className="ph-no-capture" w="full" maxW="xl" px={{ base: 1, sm: 4 }}>
      <InputGroup border="none">
        <InputLeftElement color="brand.slate.400" pointerEvents="none">
          <SearchIcon />
        </InputLeftElement>
        <Input
          className="ph-no-capture"
          color="brand.slate.600"
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={500}
          borderColor="brand.slate.300"
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          placeholder=""
          value={query}
          variant="outline"
        />
        <InputRightElement>
          {loading && <Spinner size={'sm'} />}
        </InputRightElement>
      </InputGroup>
    </Box>
  );
}
