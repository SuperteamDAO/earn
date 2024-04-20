import { SearchIcon } from '@chakra-ui/icons';
import { Box, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';

interface Props {
  query: string;
  setQuery: (query: string) => void;
}

export function QueryInput({ query, setQuery }: Props) {
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
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for bounties, projects "
          value={query}
          variant="outline"
        />
      </InputGroup>
    </Box>
  );
}
