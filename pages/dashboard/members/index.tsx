import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import Avatar from 'boring-avatars';
import React, { useEffect, useRef, useState } from 'react';

import InviteMembers from '@/components/Members/InviteMembers';
import ErrorSection from '@/components/shared/ErrorSection';
import LoadingSection from '@/components/shared/LoadingSection';
import type { UserSponsor } from '@/interface/userSponsor';
import Sidebar from '@/layouts/Sidebar';
import { userStore } from '@/store/user';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

const debounce = require('lodash.debounce');

const Index = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userInfo } = userStore();
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [members, setMembers] = useState<UserSponsor[]>([]);
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  const getMembers = async () => {
    setIsMembersLoading(true);
    try {
      const membersList = await axios.get('/api/members/', {
        params: {
          sponsorId: userInfo?.currentSponsorId,
          searchText,
          skip,
          take: length,
        },
      });
      setTotalMembers(membersList.data.total);
      setMembers(membersList.data.data);
      setIsMembersLoading(false);
    } catch (error) {
      setIsMembersLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo?.currentSponsorId) {
      getMembers();
    }
  }, [userInfo?.currentSponsorId, skip, searchText]);

  return (
    <Sidebar>
      {isOpen && <InviteMembers isOpen={isOpen} onClose={onClose} />}
      <Flex justify="space-between" mb={4}>
        <InputGroup w={52}>
          <Input
            bg={'white'}
            borderColor="brand.slate.400"
            _placeholder={{
              color: 'brand.slate.400',
            }}
            focusBorderColor="brand.purple"
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            placeholder="Search members..."
            type="text"
          />
          <InputRightElement pointerEvents="none">
            <SearchIcon color="brand.slate.400" />
          </InputRightElement>
        </InputGroup>
        <Button leftIcon={<AddIcon />} onClick={onOpen} variant="solid">
          Invite Members
        </Button>
      </Flex>
      {isMembersLoading && <LoadingSection />}
      {!isMembersLoading && !members?.length && (
        <ErrorSection
          title="No members found!"
          message="Invite members to join your organization!"
        />
      )}
      {!isMembersLoading && members?.length && (
        <TableContainer mb={8}>
          <Table
            border="1px solid"
            borderColor={'blackAlpha.200'}
            bgColor="white"
            variant="simple"
          >
            <Thead>
              <Tr>
                <Th
                  color="brand.slate.400"
                  fontSize="sm"
                  fontWeight={500}
                  textTransform={'capitalize'}
                >
                  Member
                </Th>
                <Th
                  color="brand.slate.400"
                  fontSize="sm"
                  fontWeight={500}
                  textAlign="center"
                  textTransform={'capitalize'}
                >
                  Role
                </Th>
                <Th
                  color="brand.slate.400"
                  fontSize="sm"
                  fontWeight={500}
                  textTransform={'capitalize'}
                >
                  Email
                </Th>
                <Th
                  color="brand.slate.400"
                  fontSize="sm"
                  fontWeight={500}
                  textTransform={'capitalize'}
                >
                  Wallet
                </Th>
                <Th
                  color="brand.slate.400"
                  fontSize="sm"
                  fontWeight={500}
                  textTransform={'capitalize'}
                ></Th>
              </Tr>
            </Thead>
            <Tbody>
              {members.map((member) => (
                <Tr key={member?.userId}>
                  <Td>
                    <Flex align="center">
                      {member?.user?.photo ? (
                        <Image
                          boxSize="32px"
                          borderRadius="full"
                          alt={`${member?.user?.firstName} ${member?.user?.lastName}`}
                          src={member?.user?.photo}
                        />
                      ) : (
                        <Avatar
                          name={`${member?.user?.firstName} ${member?.user?.lastName}`}
                          colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                          size={32}
                          variant="marble"
                        />
                      )}
                      <Box display={{ base: 'none', md: 'block' }} ml={2}>
                        <Text color="brand.slate.800" fontSize="sm">
                          {`${member?.user?.firstName} ${member?.user?.lastName}`}
                        </Text>
                        <Text color="brand.slate.500" fontSize="xs">
                          @{member?.user?.username}
                        </Text>
                      </Box>
                    </Flex>
                  </Td>
                  <Td>
                    <Flex align="center" justify="center">
                      <Tag
                        color={'brand.purple'}
                        fontWeight={700}
                        bg={'brand.slate.200'}
                        size="md"
                        variant="solid"
                      >
                        {member?.role}
                      </Tag>
                    </Flex>
                  </Td>
                  <Td color={'brand.slate.800'}>
                    {member?.user?.email || '-'}
                  </Td>
                  <Td color={'brand.slate.800'}>
                    {truncatePublicKey(member?.user?.publicKey)}
                    <Tooltip label="Copy Wallet ID" placement="right">
                      <CopyIcon
                        cursor="pointer"
                        ml={1}
                        onClick={() =>
                          navigator.clipboard.writeText(
                            member?.user?.publicKey as string
                          )
                        }
                      />
                    </Tooltip>
                  </Td>
                  <Td></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
      <Flex align="center" justify="end" mt={6}>
        <Text mr={4} color="brand.slate.400" fontSize="sm">
          <Text as="span" fontWeight={700}>
            {skip + 1}
          </Text>{' '}
          -{' '}
          <Text as="span" fontWeight={700}>
            {Math.min(skip + length, totalMembers)}
          </Text>{' '}
          of{' '}
          <Text as="span" fontWeight={700}>
            {totalMembers}
          </Text>{' '}
          Members
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
            totalMembers < skip + length || (skip > 0 && skip % length !== 0)
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
};

export default Index;
