import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Badge,
  Button,
  Center,
  Flex,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
} from '@chakra-ui/react';
import Image from 'next/image';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';

import SparkleIcon from '../../icons/sparkle.svg';
import { type ScoutRowType } from '../../types';
import { InviteButton } from './InviteButton';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  maximumFractionDigits: 0,
  currency: 'USD',
}).format;

export const MAX_SHOW_SKILLS = 5;

interface Props {
  bountyId: string;
  scouts: ScoutRowType[];
  setInvited: (userId: string) => void;
}

export function ScountTable({ bountyId, scouts, setInvited }: Props) {
  const posthog = usePostHog();

  return (
    <TableContainer
      className="hide-scrollbar"
      overflowX="auto"
      w="full"
      h={scouts.length === 0 ? '25rem' : 'auto'}
      border="1px solid #E2E8F0"
      borderRadius="md"
    >
      <Table>
        <Thead>
          <Tr textTransform={'none'} bg="#F8FAFC">
            <Th
              color="brand.slate.500"
              fontSize={'xs'}
              fontWeight={500}
              letterSpacing={0.5}
              textAlign={'start'}
              textTransform={'none'}
            >
              User
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
              <Flex align="center" justify={'center'} gap={2}>
                $ Earned
                <Tooltip
                  fontSize="xs"
                  label="$ Earned across all relevant skills for this listing."
                >
                  <InfoOutlineIcon
                    w={3}
                    h={3}
                    display={{ base: 'none', md: 'block' }}
                  />
                </Tooltip>
              </Flex>
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
              <Flex align="center" justify={'center'} gap={2}>
                Match Score
                <Tooltip
                  fontSize="xs"
                  label="An aggregate score based on multiple factors such as number of matched skills, $ earned, etc."
                >
                  <InfoOutlineIcon
                    w={3}
                    h={3}
                    display={{ base: 'none', md: 'block' }}
                  />
                </Tooltip>
              </Flex>
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
              <Flex align="center" gap={2}>
                Matched Skills
                <Tooltip
                  fontSize="xs"
                  label="Matched Skills refer to the skills of the listings the users have previously won."
                >
                  <InfoOutlineIcon
                    w={3}
                    h={3}
                    display={{ base: 'none', md: 'block' }}
                  />
                </Tooltip>
              </Flex>
            </Th>
            <Th />
          </Tr>
        </Thead>
        {scouts.length === 0 && (
          <VStack
            pos="absolute"
            top={'12rem'}
            left="50%"
            gap={3}
            mx="auto"
            transform="translateX(-50%)"
          >
            <Center p={5} bg="brand.slate.100" rounded="full">
              <svg
                width="54"
                height="54"
                viewBox="0 0 54 54"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  opacity="0.3"
                  x="9"
                  y="11.25"
                  width="36"
                  height="13.5"
                  rx="1.5"
                  fill="#94A3B8"
                />
                <rect
                  x="9"
                  y="29.25"
                  width="36"
                  height="13.5"
                  rx="1.5"
                  fill="#94A3B8"
                />
              </svg>
            </Center>
            <VStack gap={0} fontSize="base" fontWeight={600}>
              <Text>No Profiles Found</Text>
              <Text color="brand.slate.500" fontWeight={400}>
                We couldn’t find any suitable matches for your listing
              </Text>
            </VStack>
          </VStack>
        )}
        {scouts.length > 0 && (
          <Tbody color="brand.slate.500" fontSize="sm" fontWeight={500}>
            {scouts.map((scout) => (
              <Tr key={scout.id + scout.invited}>
                <Td w="fit-content" h="full" fontSize="xs">
                  <Link
                    className="ph-no-capture"
                    as={NextLink}
                    alignItems="center"
                    gap={2}
                    display="flex"
                    href={`/t/${scout.username}`}
                    onClick={() => {
                      posthog.capture('profile click_scouts', {
                        clicked_username: scout.username,
                      });
                    }}
                    target="_blank"
                  >
                    <Avatar
                      w={{ base: 5, md: 8 }}
                      h={{ base: 5, md: 8 }}
                      src={scout.pfp ?? undefined}
                    />
                    <VStack
                      align="start"
                      justify={{ base: 'center', md: 'start' }}
                      gap={1}
                      lineHeight={{ base: 'normal', md: 1.15 }}
                    >
                      <Flex gap={1}>
                        <Text
                          overflowX="hidden"
                          maxW={'7rem'}
                          color="black"
                          textOverflow={'ellipsis'}
                        >
                          {scout.name}
                        </Text>
                        {scout.recommended && (
                          <Tooltip fontSize="xs" label="Superteam Recommended">
                            <Image src={SparkleIcon} alt="sparkle" />
                          </Tooltip>
                        )}
                      </Flex>
                      <Text
                        overflowX="hidden"
                        maxW={'7rem'}
                        textOverflow={'ellipsis'}
                      >
                        @{scout.username}
                      </Text>
                    </VStack>
                  </Link>
                </Td>
                <Td h="full" px={{ base: 1, md: 2 }}>
                  <Flex justify="center" gap={2}>
                    <Text color="black" textAlign={'center'}>
                      {formatter(scout.dollarsEarned)}
                    </Text>
                  </Flex>
                </Td>
                <Td h="full" px={{ base: 1, md: 2 }}>
                  <Flex align="center" justify="center" gap={3}>
                    <Text color="black" textAlign={'center'}>
                      {scout.score}
                    </Text>
                    <ScoreBar score={scout.score} />
                  </Flex>
                </Td>
                <Td h="full" px={{ base: 1, md: 2 }}>
                  <Flex gap={2} h="full" textAlign={'center'}>
                    {scout.skills.slice(0, MAX_SHOW_SKILLS).map((s) => (
                      <Badge
                        key={s}
                        px={2}
                        color="#64739C"
                        fontSize={'x-small'}
                        fontWeight={500}
                        textTransform={'none'}
                        bg="#EFF1F5"
                      >
                        {s}
                      </Badge>
                    ))}
                    {scout.skills.length > MAX_SHOW_SKILLS && (
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
                            +{scout.skills.length - MAX_SHOW_SKILLS}
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
                            {scout.skills.slice(MAX_SHOW_SKILLS).map((s) => (
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
                <Td align="left" pl="0">
                  <Flex align="start" gap={2} h={'2rem'}>
                    <Link
                      className="ph-no-capture"
                      as={NextLink}
                      alignItems="center"
                      display="block"
                      h="full"
                      href={`/t/${scout.username}`}
                      onClick={() => {
                        posthog.capture('view profile click_scouts', {
                          clicked_username: scout.username,
                        });
                      }}
                      target="_blank"
                    >
                      <Button h="full" fontSize="xs" variant="ghost">
                        View Profile
                      </Button>
                    </Link>
                    <InviteButton
                      setInvited={setInvited}
                      userId={scout.userId}
                      invited={scout.invited}
                      bountyId={bountyId}
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        )}
      </Table>
    </TableContainer>
  );
}

function ScoreBar({ score }: { score: number }) {
  const first = normalizeValue(score, 5, 6),
    second = normalizeValue(score, 6, 7),
    third = normalizeValue(score, 7, 10),
    color = colorScore(score);

  return (
    <Flex gap={0.5} h={2}>
      <Progress w="1rem" h={'full'} colorScheme={color} value={first} />
      <Progress w="1rem" h={'full'} colorScheme={color} value={second} />
      <Progress w="1rem" h={'full'} colorScheme={color} value={third} />
    </Flex>
  );
}

function colorScore(score: number) {
  if (score > 7) return 'brand.progress.darkGreen';
  if (score > 6) return 'brand.progress.lightGreen';
  return 'brand.progress.lightYellow';
}

function normalizeValue(
  value: number,
  lowerEnd: number,
  upperEnd: number,
): number {
  if (value <= lowerEnd) {
    return 0;
  } else if (value >= upperEnd) {
    return 100;
  } else {
    const range = upperEnd - lowerEnd;
    const normalizedValue = (value - lowerEnd) / range;
    return Math.round(normalizedValue * 100);
  }
}
