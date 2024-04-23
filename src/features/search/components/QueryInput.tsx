import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import { LoaderIcon } from 'react-hot-toast';

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
          color="brand.slate.400"
          fontSize="sm"
          fontWeight={500}
          borderColor="brand.slate.300"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for Superteam Earn Listings"
          value={query}
          variant="outline"
        />
        <InputRightElement>{loading && <LoaderIcon />}</InputRightElement>
      </InputGroup>
    </Box>
  );
}
