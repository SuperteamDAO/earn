import '/node_modules/flag-icons/css/flag-icons.min.css';

import {
  Avatar,
  Badge,
  Center,
  Flex,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { UserFlag } from '@/components/shared/UserFlag';
import { useUser } from '@/store/user';

import { type RowType, type SKILL } from '../types';
import { getSubskills, skillCategories } from '../utils';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  maximumFractionDigits: 0,
  currency: 'USD',
}).format;

interface Props {
  rankings: RowType[];
  skill: SKILL;
  userRank: RowType | null;
  loading: boolean;
}

export function RanksTable({ rankings, skill, userRank, loading }: Props) {
  const { user } = useUser();
  const posthog = usePostHog();

  const userSkills = getSubskills(user?.skills as any, skillCategories[skill]);

  return (
    <TableContainer
      className="hide-scrollbar"
      overflowX="auto"
      w="full"
      h={rankings.length === 0 ? '35rem' : 'auto'}
      opacity={loading ? 0.3 : 1}
      border="1px solid #E2E8F0"
      borderRadius="md"
    >
      <Table style={{ borderCollapse: 'collapse' }}>
        <Thead>
          <Tr textTransform={'none'} bg="#F8FAFC">
            <Th
              px={{ base: 1, md: 2 }}
              color="brand.slate.500"
              fontSize={'xs'}
              fontWeight={500}
              letterSpacing={0.5}
              textAlign={'center'}
              textTransform={'none'}
            >
              Rank
            </Th>
            <Th
              px={{ base: 1, md: 2 }}
              color="brand.slate.500"
              fontSize={'xs'}
              fontWeight={500}
              letterSpacing={0.5}
              textAlign={'start'}
              textTransform={'none'}
            >
              Name
            </Th>
            <Th
              px={{ base: 1, md: 2 }}
              color="brand.slate.500"
              fontSize={'xs'}
              fontWeight={500}
              letterSpacing={0.5}
              textAlign={'center'}
              textTransform={'none'}
            >
              <Text display={{ base: 'none', md: 'block' }}>
                Dollars Earned
              </Text>
              <Text display={{ base: 'block', md: 'none' }}>$ Earned</Text>
            </Th>
            <Th
              px={{ base: 1, md: 2 }}
              color="brand.slate.500"
              fontSize={'xs'}
              fontWeight={500}
              letterSpacing={0.5}
              textAlign={'center'}
              textTransform={'none'}
            >
              Win Rate
            </Th>
            <Th
              px={{ base: 1, md: 2 }}
              color="brand.slate.500"
              fontSize={'xs'}
              fontWeight={500}
              letterSpacing={0.5}
              textAlign={'center'}
              textTransform={'none'}
            >
              Wins
            </Th>
            <Th
              overflowX="hidden"
              maxW={{ base: '3.5rem', md: 'none' }}
              px={{ base: 1, md: 2 }}
              color="brand.slate.500"
              fontSize={'xs'}
              fontWeight={500}
              letterSpacing={0.5}
              textAlign={'center'}
              textTransform={'none'}
              textOverflow="ellipsis"
            >
              Submissions
            </Th>
            <Th
              display={{ base: 'none', md: skill !== 'ALL' ? 'none' : 'block' }}
              px={{ base: 1, md: 2 }}
              color="brand.slate.500"
              fontSize={'xs'}
              fontWeight={500}
              letterSpacing={0.5}
              textAlign={'start'}
              textTransform={'none'}
            >
              Skills
            </Th>
          </Tr>
        </Thead>
        {rankings.length === 0 && (
          <VStack
            pos="absolute"
            top={'10rem'}
            left="50%"
            mx="auto"
            transform="translateX(-50%)"
          >
            <Center w={20} h={20} bg="brand.slate.100" rounded="full">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_482_662)">
                  <path
                    d="M16 11V3H8V9H2V21H22V11H16ZM10 5H14V19H10V5ZM4 11H8V19H4V11ZM20 19H16V13H20V19Z"
                    fill="#64748B"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_482_662">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </Center>
            <VStack fontSize="xs" fontWeight={500}>
              <Text>The Leaderboard is empty for your filters</Text>
              <Text color="brand.slate.500">
                Please change your filters or try again later
              </Text>
            </VStack>
          </VStack>
        )}
        {rankings.length > 0 && (
          <Tbody color="brand.slate.500" fontSize="xs" fontWeight={500}>
            {rankings.map((row) => (
              <Tr
                key={row.username}
                h="full"
                bg={row.username === user?.username ? '#F5F3FF80' : ''}
              >
                <Td h="full" px={{ base: 1, md: 2 }} textAlign={'center'}>
                  #{row.rank}
                </Td>
                <Td h="full" px={{ base: 1, md: 2 }}>
                  <Link
                    className="ph-no-capture"
                    as={NextLink}
                    alignItems="center"
                    gap={2}
                    display="flex"
                    href={`/t/${row.username}`}
                    onClick={() => {
                      posthog.capture('profile click_leaderboard', {
                        clicked_username: row.username,
                      });
                    }}
                    target="_blank"
                  >
                    <Avatar
                      w={{ base: 5, md: 8 }}
                      h={{ base: 5, md: 8 }}
                      src={row.pfp ?? undefined}
                    />
                    <VStack
                      align="start"
                      justify={{ base: 'center', md: 'start' }}
                      gap={1}
                      lineHeight={{ base: 'normal', md: 1.15 }}
                    >
                      <Text
                        display={{ base: 'block', md: 'none' }}
                        overflowX="hidden"
                        maxW={'7rem'}
                        color="black"
                        _groupHover={{
                          textDecoration: 'underline',
                        }}
                        textOverflow={'ellipsis'}
                      >
                        {row.name.split(' ')[0] +
                          ' ' +
                          row.name.split(' ')[1]?.slice(0, 1).toUpperCase()}
                      </Text>
                      <Flex align={'center'} gap={2}>
                        <Text
                          display={{ base: 'none', md: 'block' }}
                          overflowX="hidden"
                          maxW={'7rem'}
                          color="black"
                          textOverflow={'ellipsis'}
                        >
                          {row.name}
                        </Text>
                        {row.location && (
                          <UserFlag size="12px" location={row.location} />
                        )}
                      </Flex>
                      <Text
                        display={{ base: 'none', md: 'block' }}
                        overflowX="hidden"
                        maxW={'7rem'}
                        textOverflow={'ellipsis'}
                      >
                        @{row.username}
                      </Text>
                    </VStack>
                  </Link>
                </Td>
                <Td h="full" px={{ base: 1, md: 2 }}>
                  <Flex justify="center" gap={2}>
                    <Text color="black" textAlign={'center'}>
                      {formatter(row.dollarsEarned)}
                    </Text>
                    <Text
                      display={{ base: 'none', md: 'block' }}
                      textAlign={'center'}
                    >
                      USD
                    </Text>
                  </Flex>
                </Td>
                <Td h="full" px={{ base: 1, md: 2 }} textAlign={'center'}>
                  {row.winRate}%
                </Td>
                <Td h="full" px={{ base: 1, md: 2 }} textAlign={'center'}>
                  {row.wins}
                </Td>
                <Td h="full" px={{ base: 1, md: 2 }} textAlign={'center'}>
                  {row.submissions}
                </Td>
                <Td
                  display={{
                    base: 'none',
                    md: skill !== 'ALL' ? 'none' : 'table-cell',
                  }}
                  h="full"
                  px={{ base: 1, md: 2 }}
                >
                  <Flex gap={2} h="full" textAlign={'center'}>
                    {row.skills.slice(0, 2).map((s) => (
                      <Badge
                        key={s}
                        px={2}
                        color="#64739C"
                        fontSize={'x-small'}
                        fontWeight={500}
                        textTransform={'none'}
                        bg="#EFF1F5"
                        rounded="full"
                      >
                        {s}
                      </Badge>
                    ))}
                    {row.skills.length > 2 && (
                      <Popover trigger="hover">
                        <PopoverTrigger>
                          <Badge
                            px={2}
                            color="#64739C"
                            fontSize={'x-small'}
                            fontWeight={500}
                            textTransform={'none'}
                            bg="#EFF1F5"
                            rounded="full"
                          >
                            +{row.skills.length - 2}
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent
                          w="fit-content"
                          maxW="10rem"
                          px={4}
                          py={2}
                          shadow="lg"
                        >
                          <Flex
                            wrap={'wrap'}
                            gap={2}
                            w="fit-content"
                            h="full"
                            textAlign={'center'}
                          >
                            {row.skills.slice(2).map((s) => (
                              <Badge
                                key={s}
                                px={2}
                                color="#64739C"
                                fontSize={'x-small'}
                                fontWeight={500}
                                textTransform={'none'}
                                bg="#EFF1F5"
                                rounded="full"
                              >
                                {s}
                              </Badge>
                            ))}
                          </Flex>
                        </PopoverContent>
                      </Popover>
                    )}
                  </Flex>
                </Td>
              </Tr>
            ))}
            {user && !rankings.find((r) => r.username === user?.username) && (
              <Tr w="full" bg="#F5F3FF80">
                <Td
                  pos="sticky"
                  zIndex={100}
                  bottom={0}
                  px={{ base: 1, md: 2 }}
                  textAlign={'center'}
                  borderBottomWidth={'0px'}
                >
                  {userRank ? '#' + userRank.rank : '-'}
                </Td>
                <Td
                  pos="sticky"
                  zIndex={100}
                  bottom={0}
                  px={{ base: 1, md: 2 }}
                  borderBottomWidth={'0px'}
                >
                  <Link
                    className="ph-no-capture"
                    as={NextLink}
                    alignItems="center"
                    gap={2}
                    display="flex"
                    href={`/t/${user.username}`}
                    onClick={() => {
                      posthog.capture('profile click_leaderboard', {
                        clicked_username: user.username,
                      });
                    }}
                    target="_blank"
                  >
                    <Avatar
                      w={{ base: 5, md: 8 }}
                      h={{ base: 5, md: 8 }}
                      src={user.photo ?? undefined}
                    />
                    <VStack
                      align="start"
                      justify={{ base: 'center', md: 'start' }}
                      gap={1}
                      lineHeight={{ base: 1.5, md: 1.15 }}
                    >
                      <Text
                        display={{ base: 'block', md: 'none' }}
                        overflowX="hidden"
                        maxW={'7rem'}
                        color="black"
                        _groupHover={{
                          textDecoration: 'underline',
                        }}
                        textOverflow={'ellipsis'}
                      >
                        {user.firstName +
                          ' ' +
                          user.lastName?.slice(0, 1).toUpperCase()}
                      </Text>
                      <Flex align={'center'} gap={2}>
                        <Text
                          display={{ base: 'none', md: 'block' }}
                          overflowX="hidden"
                          maxW={'7rem'}
                          color="black"
                          textOverflow={'ellipsis'}
                        >
                          {user.firstName + ' ' + user.lastName}
                        </Text>
                        {user.location && (
                          <UserFlag size="12px" location={user.location} />
                        )}
                      </Flex>
                      <Text
                        display={{ base: 'none', md: 'block' }}
                        overflowX="hidden"
                        maxW={'7rem'}
                        textOverflow={'ellipsis'}
                      >
                        @{user.username}
                      </Text>
                    </VStack>
                  </Link>
                </Td>
                <Td
                  pos="sticky"
                  zIndex={100}
                  bottom={0}
                  px={{ base: 1, md: 2 }}
                  borderBottomWidth={'0px'}
                >
                  <Flex justify="center" gap={2}>
                    <Text color="black" textAlign={'center'}>
                      {formatter(userRank?.dollarsEarned ?? 0)}
                    </Text>
                    <Text
                      display={{ base: 'none', md: 'block' }}
                      textAlign={'center'}
                    >
                      USD
                    </Text>
                  </Flex>
                </Td>
                <Td
                  pos="sticky"
                  zIndex={100}
                  bottom={0}
                  px={{ base: 1, md: 2 }}
                  textAlign={'center'}
                  borderBottomWidth={'0px'}
                >
                  {userRank?.winRate ? userRank?.winRate + '%' : '-'}
                </Td>
                <Td
                  pos="sticky"
                  zIndex={100}
                  bottom={0}
                  px={{ base: 1, md: 2 }}
                  textAlign={'center'}
                  borderBottomWidth={'0px'}
                >
                  {userRank?.wins ?? '-'}
                </Td>
                <Td
                  pos="sticky"
                  zIndex={100}
                  bottom={0}
                  px={{ base: 1, md: 2 }}
                  textAlign={'center'}
                  borderBottomWidth={'0px'}
                >
                  {userRank?.submissions ?? '-'}
                </Td>
                <Td
                  bottom={0}
                  display={{
                    base: 'none',
                    md: skill !== 'ALL' ? 'none' : 'table-cell',
                  }}
                  px={{ base: 1, md: 2 }}
                  borderBottomWidth={'0px'}
                >
                  <Flex gap={2} h="full" textAlign={'center'}>
                    {userSkills.slice(0, 2).map((s) => (
                      <Badge
                        key={s}
                        px={2}
                        color="#64739C"
                        fontSize={'x-small'}
                        fontWeight={500}
                        textTransform={'none'}
                        bg="#EFF1F5"
                        rounded="full"
                      >
                        {s}
                      </Badge>
                    ))}
                    {userSkills.length > 2 && (
                      <Popover trigger="hover">
                        <PopoverTrigger>
                          <Badge
                            px={2}
                            color="#64739C"
                            fontSize={'x-small'}
                            fontWeight={500}
                            textTransform={'none'}
                            bg="#EFF1F5"
                            rounded="full"
                          >
                            +{userSkills.length - 2}
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent
                          w="fit-content"
                          maxW="10rem"
                          px={4}
                          py={2}
                          shadow="lg"
                        >
                          <Flex
                            wrap={'wrap'}
                            gap={2}
                            w="fit-content"
                            h="full"
                            textAlign={'center'}
                          >
                            {userSkills.slice(2).map((s) => (
                              <Badge
                                key={s}
                                px={2}
                                color="#64739C"
                                fontSize={'x-small'}
                                fontWeight={500}
                                textTransform={'none'}
                                bg="#EFF1F5"
                                rounded="full"
                              >
                                {s}
                              </Badge>
                            ))}
                          </Flex>
                        </PopoverContent>
                      </Popover>
                    )}
                  </Flex>
                </Td>
              </Tr>
            )}
          </Tbody>
        )}
      </Table>
    </TableContainer>
  );
}
