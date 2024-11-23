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
  Divider,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import {
  Banner,
  InviteMembers,
  membersQuery,
  sponsorStatsQuery,
} from '@/features/sponsor-dashboard';
import { EarnAvatar } from '@/features/talent';
import type { UserSponsor } from '@/interface/userSponsor';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

const debounce = require('lodash.debounce');

const Index = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const { data: sponsorStats, isLoading: isStatsLoading } = useQuery(
    sponsorStatsQuery(user?.currentSponsorId),
  );

  const queryClient = useQueryClient();

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  const { data: session } = useSession();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('members tab_sponsor');
  }, []);

  const { data: membersData, isLoading: isMembersLoading } = useQuery(
    membersQuery({
      searchText,
      skip,
      length,
      currentSponsorId: user?.currentSponsorId,
    }),
  );

  const totalMembers = membersData?.total || 0;
  const members = membersData?.data || [];

  const isAdminLoggedIn = () => {
    if (
      user === undefined ||
      user?.UserSponsors === undefined ||
      user?.UserSponsors[0] === undefined
    ) {
      return false;
    }

    return (
      session?.user?.role === 'GOD' || user?.UserSponsors[0]?.role === 'ADMIN'
    );
  };

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axios.post('/api/sponsor-dashboard/members/remove', {
        id: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['members', user?.currentSponsorId],
      });
      toast.success('成功');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('失败。请重试');
    },
  });

  const onRemoveMember = (userId: string | undefined) => {
    if (userId) {
      removeMemberMutation.mutate(userId);
    }
  };
  return (
    <SponsorLayout>
      {isOpen && <InviteMembers isOpen={isOpen} onClose={onClose} />}
      <Banner stats={sponsorStats} isLoading={isStatsLoading} />
      <Flex justify="space-between" mb={4}>
        <Flex align="center" gap={3}>
          <Text color="brand.slate.800" fontSize="lg" fontWeight={600}>
            团队成员
          </Text>
          <Divider
            h="60%"
            borderColor="brand.slate.200"
            orientation="vertical"
          />
          <Text color="brand.slate.500">管理项目方成员</Text>
        </Flex>
        <Flex align="center" gap={3}>
          {(session?.user?.role === 'GOD' ||
            !!(
              user?.UserSponsors?.length &&
              user?.UserSponsors.find(
                (s) => s.sponsorId === user.currentSponsorId,
              )?.role === 'ADMIN'
            )) && (
              <Button
                className="ph-no-capture"
                color="#6366F1"
                bg="#E0E7FF"
                leftIcon={<AddIcon />}
                onClick={() => {
                  posthog.capture('invite member_sponsor');
                  onOpen();
                }}
                variant="solid"
              >
                邀请成员
              </Button>
            )}
          <InputGroup w={52}>
            <Input
              bg={'white'}
              borderColor="brand.slate.200"
              _placeholder={{
                color: 'brand.slate.400',
                fontWeight: 500,
                fontSize: 'md',
              }}
              focusBorderColor="brand.purple"
              onChange={(e) => debouncedSetSearchText(e.target.value)}
              placeholder=""
              type="text"
            />
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="brand.slate.400" />
            </InputLeftElement>
          </InputGroup>
        </Flex>
      </Flex>
      {isMembersLoading && <LoadingSection />}
      {!isMembersLoading && !members?.length && (
        <ErrorSection
          title="No members found!"
          message="Invite members to join your organization!"
        />
      )}
      {!isMembersLoading && !!members?.length && (
        <TableContainer
          mb={8}
          borderWidth={'1px'}
          borderColor={'brand.slate.200'}
          borderRadius={8}
        >
          <Table variant="simple">
            <Thead>
              <Tr bg="brand.slate.100">
                <Th
                  color="brand.slate.400"
                  fontSize="sm"
                  fontWeight={500}
                  letterSpacing={'-2%'}
                  textTransform={'capitalize'}
                >
                  成员
                </Th>
                <Th
                  color="brand.slate.400"
                  fontSize="sm"
                  fontWeight={500}
                  letterSpacing={'-2%'}
                  textTransform={'capitalize'}
                >
                  角色
                </Th>
                <Th
                  color="brand.slate.400"
                  fontSize="sm"
                  fontWeight={500}
                  letterSpacing={'-2%'}
                  textTransform={'capitalize'}
                >
                  邮箱
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
              {members.map((member: UserSponsor) => {
                return (
                  <Tr key={member?.userId}>
                    <Td>
                      <Flex align="center">
                        <EarnAvatar
                          size="36px"
                          id={member?.user?.id}
                          avatar={member?.user?.photo}
                        />
                        <Box display={{ base: 'none', md: 'block' }} ml={2}>
                          <Text
                            color="brand.slate.500"
                            fontSize="15px"
                            fontWeight={500}
                          >
                            {`${member?.user?.firstName} ${member?.user?.lastName}`}
                          </Text>
                          <Text color="brand.slate.400" fontSize="sm">
                            @{member?.user?.username}
                          </Text>
                        </Box>
                      </Flex>
                    </Td>
                    <Td>
                      <Flex align="center">
                        <Tag
                          color={
                            member?.role === 'ADMIN' ? '#0D9488' : '#8B5CF6'
                          }
                          fontWeight={600}
                          bg={member?.role === 'ADMIN' ? '#D1FAE5' : '#F3E8FF'}
                          size="sm"
                          variant="solid"
                        >
                          {member?.role}
                        </Tag>
                      </Flex>
                    </Td>
                    <Td color={'brand.slate.600'} fontWeight={500}>
                      {member?.user?.email}
                      <Tooltip label="Copy Email Address" placement="right">
                        <CopyIcon
                          cursor="pointer"
                          ml={1}
                          onClick={() =>
                            navigator.clipboard.writeText(
                              member?.user?.email as string,
                            )
                          }
                        />
                      </Tooltip>
                    </Td>
                    <Td>
                      <RemoveMemberModal
                        member={member}
                        isAdminLoggedIn={isAdminLoggedIn}
                        session={session}
                        onRemoveMember={onRemoveMember}
                      />
                    </Td>
                  </Tr>
                );
              })}
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
          成员
        </Text>
        <Button
          mr={4}
          isDisabled={skip <= 0}
          leftIcon={<ChevronLeftIcon w={5} h={5} />}
          onClick={() => (skip >= length ? setSkip(skip - length) : setSkip(0))}
          size="sm"
          variant="outline"
        >
          上一页
        </Button>
        <Button
          isDisabled={
            totalMembers <= skip + length || (skip > 0 && skip % length !== 0)
          }
          onClick={() => skip % length === 0 && setSkip(skip + length)}
          rightIcon={<ChevronRightIcon w={5} h={5} />}
          size="sm"
          variant="outline"
        >
          下一页
        </Button>
      </Flex>
    </SponsorLayout>
  );
};

const RemoveMemberModal = ({
  member,
  isAdminLoggedIn,
  session,
  onRemoveMember,
}: {
  member: UserSponsor;
  isAdminLoggedIn: () => boolean;
  session: Session | null;
  onRemoveMember: (userId: string | undefined) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const removeMember = async (userId: string | undefined) => {
    await onRemoveMember(userId);
    setIsOpen(false);
    toast.success('成功');
  };

  const isAdmin = member?.role === 'ADMIN' || session?.user?.role === 'GOD';

  return (
    <Flex align="center" justify="end">
      {isAdminLoggedIn() &&
        isAdmin &&
        member?.user?.email !== session?.user?.email && (
          <Button
            color="#6366F1"
            bg="#E0E7FF"
            onClick={() => setIsOpen(true)}
            size="sm"
            variant="solid"
          >
            删除
          </Button>
        )}
      <Modal
        key={member.userId}
        closeOnOverlayClick={false}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <ModalOverlay />
        <ModalContent py={2}>
          <ModalHeader color={'brand.slate.900'} fontSize="xl">
            删除成员？
          </ModalHeader>
          <ModalCloseButton mt={4} onClick={() => setIsOpen(false)} />
          <ModalBody>
            <Text>
              您确定要删除
              {' '}
              <Text as="span" fontWeight={600}>
                {member.user?.email}
              </Text>{' '}
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-end" display="flex" mt={2}>
            <Button
              w="full"
              onClick={() => {
                removeMember(member.userId);
              }}
            >
              删除成员
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Index;
