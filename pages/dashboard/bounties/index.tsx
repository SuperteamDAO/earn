import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  InfoOutlineIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { AiOutlineOrderedList } from 'react-icons/ai';
import { FiMoreVertical } from 'react-icons/fi';

import { tokenList } from '@/constants/index';
import type { Bounty } from '@/interface/bounty';
import Sidebar from '@/layouts/Sidebar';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

const debounce = require('lodash.debounce');

function Bounties() {
  const router = useRouter();
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

  const getBgColor = (status: String) => {
    switch (status) {
      case 'PUBLISHED':
        return 'green';
      case 'DRAFT':
        return 'orange';
      default:
        return 'gray';
    }
  };

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
          gap={4}
          px={4}
          py={1}
          borderBottom="1px solid"
          borderBottomColor={'blackAlpha.200'}
        >
          <Text w="96" color="brand.slate.400" fontSize="sm" fontWeight={500}>
            Bounty Name
          </Text>
          <Text w="40" color="brand.slate.400" fontSize="sm" fontWeight={500}>
            Deadline
          </Text>
          <Text w="40" color="brand.slate.400" fontSize="sm" fontWeight={500}>
            Prize
          </Text>
          <Text
            align="center"
            w="40"
            color="brand.slate.400"
            fontSize="sm"
            fontWeight={500}
          >
            Status
          </Text>
          <Text w="40"></Text>
        </Flex>
        {!isBountiesLoading &&
          bounties.map((bounty) => {
            const deadlineFromNow = bounty?.deadline
              ? dayjs(bounty.deadline).fromNow()
              : '-';
            const deadline = bounty?.deadline
              ? dayjs(bounty.deadline).format('MMM D, YYYY HH:mm')
              : '-';
            const bountyStatus =
              // eslint-disable-next-line no-nested-ternary
              bounty.status === 'OPEN'
                ? bounty.isPublished
                  ? 'PUBLISHED'
                  : 'DRAFT'
                : 'CLOSED';
            return (
              <Flex
                key={bounty.id}
                align="center"
                gap={4}
                px={4}
                py={3}
                borderBottom="1px solid"
                borderBottomColor={'blackAlpha.200'}
              >
                <Text w="96" color="brand.slate.600" fontWeight={700}>
                  {bounty.title}
                </Text>
                <Box w="40" color="brand.slate.600" fontSize="sm">
                  <Tooltip
                    color="white"
                    bg="brand.purple"
                    label={deadline}
                    placement="bottom"
                  >
                    <Flex align="center">
                      {deadlineFromNow}
                      <InfoOutlineIcon
                        ml={1}
                        w={3}
                        h={3}
                        color="brand.slate.400"
                      />
                    </Flex>
                  </Tooltip>
                </Box>
                <Flex align="center" justify="start" w="40">
                  <Image
                    w={5}
                    h="auto"
                    mr={2}
                    alt={'green doller'}
                    rounded={'full'}
                    src={
                      tokenList.filter((e) => e?.tokenName === bounty.token)[0]
                        ?.icon ?? '/assets/icons/green-doller.svg'
                    }
                  />
                  <Text color="brand.slate.400">
                    {(bounty.rewardAmount || 0).toLocaleString('en-US')}
                  </Text>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  w="40"
                  color="brand.slate.600"
                  fontSize="sm"
                >
                  <Tag
                    color={'white'}
                    bg={getBgColor(bountyStatus)}
                    variant="solid"
                  >
                    {bountyStatus}
                  </Tag>
                </Flex>
                <Flex justify="end" w={40}>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      border="none"
                      aria-label="Options"
                      icon={<FiMoreVertical />}
                      variant="outline"
                    />
                    <MenuList>
                      <MenuItem
                        icon={<ExternalLinkIcon />}
                        onClick={() =>
                          window.open(
                            `${router.basePath}/listings/bounties/${bounty.slug}`,
                            '_ blank'
                          )
                        }
                      >
                        View Bounty
                      </MenuItem>
                      <MenuItem
                        icon={<AiOutlineOrderedList />}
                        onClick={() =>
                          router.push(`/dashboard/bounties/${bounty.slug}`)
                        }
                      >
                        View Submissions
                      </MenuItem>
                      {/* <MenuItem icon={<AiOutlineEdit />}>Edit Bounty</MenuItem> */}
                    </MenuList>
                  </Menu>
                </Flex>
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
          isDisabled={
            totalBounties < skip + length || (skip > 0 && skip % length !== 0)
          }
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
