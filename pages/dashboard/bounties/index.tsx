import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

import type { Bounty } from '@/interface/bounty';
import Sidebar from '@/layouts/Sidebar';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

const debounce = require('lodash.debounce');

function Bounties() {
  const { userInfo } = userStore();
  const [totalBounties, setTotalBounties] = useState(0);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isBountiesLoading, setIsBountiesLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  const getBounties = async () => {
    setIsBountiesLoading(true);
    try {
      const bountiesList = await axios.get('/api/bounties/', {
        params: {
          sponsorId: userInfo?.currentSponsorId,
          searchText,
          skip,
          take: length,
        },
      });
      setTotalBounties(bountiesList.data.total);
      setBounties(bountiesList.data.data);
      setIsBountiesLoading(false);
    } catch (error) {
      setIsBountiesLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getBounties();
    }
  }, [userInfo?.currentSponsorId, skip, searchText]);

  return (
    <Sidebar>
      <Flex justify="between" mb={4}>
        <InputGroup w={52}>
          <Input
            bg={'white'}
            borderColor="brand.slate.400"
            _placeholder={{
              color: 'brand.slate.400',
            }}
            focusBorderColor="brand.purple"
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            placeholder="Search bounties..."
            type="text"
          />
          <InputRightElement pointerEvents="none">
            <SearchIcon color="brand.slate.400" />
          </InputRightElement>
        </InputGroup>
      </Flex>
      <Box
        bg="white"
        border="1px solid"
        borderColor={'blackAlpha.200'}
        borderRadius={'md'}
      >
        <Flex
          px={4}
          py={1}
          borderBottom="1px solid"
          borderBottomColor={'blackAlpha.200'}
        >
          <Text w="80" color="brand.slate.400" fontSize="sm" fontWeight={500}>
            Bounty Name
          </Text>
          <Text w="40" color="brand.slate.400" fontSize="sm" fontWeight={500}>
            Deadline
          </Text>
          <Text w="40" color="brand.slate.400" fontSize="sm" fontWeight={500}>
            Prize
          </Text>
          <Text w="40" color="brand.slate.400" fontSize="sm" fontWeight={500}>
            Status
          </Text>
          <Text w="40" color="brand.slate.400" fontSize="sm" fontWeight={500}>
            Published
          </Text>
        </Flex>
        {!isBountiesLoading &&
          bounties.map((bounty) => {
            const deadline = bounty?.deadline
              ? dayjs(bounty.deadline).fromNow()
              : '-';
            return (
              <Flex
                key={bounty.id}
                flex={'0 0 1fr'}
                px={4}
                py={3}
                borderBottom="1px solid"
                borderBottomColor={'blackAlpha.200'}
              >
                <Text w="80" color="brand.slate.600" fontWeight={700}>
                  {bounty.title}
                </Text>
                <Text w="40" color="brand.slate.600" fontWeight={700}>
                  {deadline}
                </Text>
              </Flex>
            );
          })}
      </Box>
      <Flex align="center" justify="end" mt={6}>
        <Text mr={4} color="brand.slate.400" fontSize="sm">
          <Text as="span" fontWeight={700}>
            {skip + 1}
          </Text>{' '}
          -{' '}
          <Text as="span" fontWeight={700}>
            {Math.min(skip + length, totalBounties)}
          </Text>{' '}
          of{' '}
          <Text as="span" fontWeight={700}>
            {totalBounties}
          </Text>{' '}
          Bounties
        </Text>
        <Button
          mr={4}
          isDisabled={skip <= 0}
          leftIcon={<ChevronLeftIcon w={5} h={5} />}
          onClick={() => (skip >= length ? setSkip(skip - length) : setSkip(0))}
          size="sm"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          isDisabled={skip > 0 && skip % length !== 0}
          onClick={() => skip % length === 0 && setSkip(skip + length)}
          rightIcon={<ChevronRightIcon w={5} h={5} />}
          size="sm"
          variant="outline"
        >
          Next
        </Button>
      </Flex>
    </Sidebar>
  );
}

export default Bounties;
