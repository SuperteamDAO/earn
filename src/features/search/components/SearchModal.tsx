import { ArrowForwardIcon, SearchIcon } from '@chakra-ui/icons';
import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');

  async function search() {
    try {
      if (query.length > 0) {
        console.log('run ???');
        const resp = await axios.get(
          `/api/search/${encodeURIComponent(query)}`,
        );
        console.log('done?');
        console.log(resp);
      }
    } catch (err) {
      return;
    }
  }
  useEffect(() => {
    console.log(query);
    search();
  }, [query]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent p={0} border="none">
        <InputGroup border="none">
          <InputLeftElement color="brand.slate.400" pointerEvents="none">
            <SearchIcon />
          </InputLeftElement>
          <Input
            fontSize="sm"
            border="none"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for bounties, projects "
            value={query}
            variant="filled"
          />
          <InputRightElement color="brand.slate.400">
            <ArrowForwardIcon />
          </InputRightElement>
        </InputGroup>
      </ModalContent>
    </Modal>
  );
}
