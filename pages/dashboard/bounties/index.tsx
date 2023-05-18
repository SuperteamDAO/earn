import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

import type { Bounty } from '@/interface/bounty';
import Sidebar from '@/layouts/Sidebar';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

function Bounties() {
  const { userInfo } = userStore();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isBountiesLoading, setIsBountiesLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  console.log('file: index.tsx:24 ~ Bounties ~ setSkip:', setSkip);
  const length = 15;

  const getBounties = async () => {
    setIsBountiesLoading(true);
    console.log(
      'file: index.tsx:35 ~ getBounties ~ userInfo?.currentSponsorId:',
      userInfo?.currentSponsorId
    );
    try {
      const bountiesList = await axios.get('/api/bounties', {
        params: {
          sponsorId: userInfo?.currentSponsorId,
          searchText,
          skip,
          take: length,
        },
      });
      console.log(
        'file: index.tsx:17 ~ getBounties ~ bountiesList:',
        bountiesList
      );
      setBounties(bountiesList.data);
      setIsBountiesLoading(false);
    } catch (error) {
      console.log('file: index.tsx:15 ~ getBounties ~ error:', error);
      setIsBountiesLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getBounties();
    }
  }, [userInfo?.currentSponsorId]);

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
            onChange={(e) => setSearchText(e.target.value)}
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
              : 'No deadline';
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
    </Sidebar>
  );
}

export default Bounties;
