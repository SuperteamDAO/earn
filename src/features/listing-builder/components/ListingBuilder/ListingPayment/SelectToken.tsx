import { ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import {
  FormControl,
  type FormControlProps,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  List,
  ListItem,
  Text,
} from '@chakra-ui/react';

import { ListingFormLabel } from '../Form';
import { type Token } from './types';

interface Props extends FormControlProps {
  token: string | undefined;
  selectedToken: Token | undefined;
  searchTerm: string | undefined;
  searchResults: Token[];
  isOpen: boolean;
  selectedTokenIndex: number | null;
  handleSearch: (e: string) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onTokenSelectChange: (t: Token) => void;
}
export function SelectToken({
  token,
  selectedToken,
  searchTerm,
  searchResults,
  isOpen,
  selectedTokenIndex,
  handleSearch,
  handleKeyDown,
  onTokenSelectChange: onTokenChange,
  ...props
}: Props) {
  return (
    <FormControl pos="relative" {...props}>
      <ListingFormLabel>Select Token</ListingFormLabel>
      <InputGroup alignItems={'center'} display={'flex'}>
        {token && (
          <InputLeftElement
            alignItems={'center'}
            justifyContent={'start'}
            mt={1}
            ml={4}
          >
            <SearchIcon color="gray.300" mr={2} />
            {selectedToken ? (
              <Image
                w={'1.6rem'}
                alt={searchTerm as string}
                rounded={'full'}
                src={selectedToken.icon}
              />
            ) : (
              <></>
            )}
          </InputLeftElement>
        )}
        <Input
          py={6}
          pl={'4.5rem'}
          color="gray.700"
          fontSize="1rem"
          fontWeight={500}
          border={'1px solid #cbd5e1'}
          borderRadius={'sm'}
          focusBorderColor="brand.purple"
          onChange={(e: any) => handleSearch(e.target.value)}
          onFocus={() => {
            handleSearch('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search token"
          value={searchTerm || ''}
        />
        <InputRightElement color="gray.700" fontSize="1rem">
          <ChevronDownIcon mt="9px" />
        </InputRightElement>
      </InputGroup>
      {searchResults.length > 0 && isOpen && (
        <List
          pos={'absolute'}
          zIndex={10}
          overflowX="hidden"
          w="full"
          maxH="15rem"
          pt={1}
          color="gray.600"
          bg={'white'}
          border={'1px solid #cbd5e1'}
          borderBottomRadius={'lg'}
          id="search-input"
        >
          {searchResults.map((token, index) => (
            <ListItem
              key={token.tokenName}
              bg={selectedTokenIndex === index ? 'gray.200' : 'transparent'}
              _hover={{ background: 'gray.100' }}
              cursor="pointer"
              onClick={() => {
                onTokenChange(token);
              }}
            >
              <HStack px={3} py={2}>
                <Image
                  w={'1.6rem'}
                  alt={token.tokenName}
                  rounded={'full'}
                  src={token.icon}
                />
                <Text>{token.tokenName}</Text>
              </HStack>
            </ListItem>
          ))}
        </List>
      )}
    </FormControl>
  );
}
