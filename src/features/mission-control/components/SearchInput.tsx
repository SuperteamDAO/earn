import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import React from 'react';
import { LoaderIcon } from 'react-hot-toast';

interface SearchInputProps {
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  loading,
  query,
  setQuery,
}) => {
  return (
    <Box pos="relative" bottom={1} w="full" maxW="14rem">
      <InputGroup size="md">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="brand.slate.300" />
        </InputLeftElement>
        <Input
          color="brand.slate.500"
          fontSize="sm"
          bg="white"
          borderColor="gray.200"
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
          _placeholder={{ color: 'brand.slate.300' }}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={'Search Requests'}
          type="text"
          value={query}
        />
        <InputRightElement>{loading && <LoaderIcon />}</InputRightElement>
      </InputGroup>
    </Box>
  );
};
