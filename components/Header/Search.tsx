import { SearchIcon } from '@chakra-ui/icons';
import {
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

function Search() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const searchQuery = () => {
    let path = `${router.asPath}?search=${search}`;
    if (router.asPath.includes('?')) {
      if (router.query.search) {
        path = `${router.asPath.split('?')[0]}?search=${search}`;
      } else {
        path = `${router.asPath}&search=${search}`;
      }
    }
    router.replace(path);
  };

  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchQuery();
    }
  };

  useEffect(() => {
    if (!search) return;
    document.addEventListener('keydown', handleKeyDown);

    // eslint-disable-next-line consistent-return
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [search]);

  return (
    <HStack align="center" gap={2}>
      <InputGroup size="sm">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="brand.slate.300" />
        </InputLeftElement>
        <Input
          w={44}
          fontSize="sm"
          borderRadius={4}
          _hover={{
            borderColor: 'brand.purple',
          }}
          focusBorderColor="brand.purple"
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          placeholder="Search..."
        />
        <InputRightElement
          cursor="pointer"
          onClick={() => !!search && searchQuery()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            color="brand.slate.300"
          >
            <path
              data-name="layer1"
              fill="none"
              stroke="#cbd5e1"
              strokeMiterlimit="10"
              strokeWidth="2"
              d="M16 32h30v-8"
              strokeLinejoin="round"
              strokeLinecap="round"
            ></path>
            <path
              data-name="layer1"
              fill="none"
              stroke="#cbd5e1"
              strokeMiterlimit="10"
              strokeWidth="2"
              d="M24 40l-8-8 8-8"
              strokeLinejoin="round"
              strokeLinecap="round"
            ></path>
          </svg>
        </InputRightElement>
      </InputGroup>
    </HStack>
  );
}

export default Search;
