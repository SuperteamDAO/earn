import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Flex,
  Image,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';

import { type LocalMember } from '../../queries';
import { SortableTH, TH } from './TH';
import { UserDrawer } from './UserDrawer';

interface SortState {
  column: string;
  direction: 'asc' | 'desc' | null;
}

interface MembersTableProps {
  currentUsers: LocalMember[];
  currentSort: SortState;
  setSort: (column: string, direction: 'asc' | 'desc' | null) => void;
}

export const UserTable = ({
  currentUsers,
  currentSort,
  setSort,
}: MembersTableProps) => {
  return (
    <TableContainer
      mb={8}
      borderWidth={'1px'}
      borderColor={'brand.slate.200'}
      borderRadius={8}
    >
      <Table variant="simple">
        <Thead>
          <Tr bg="brand.slate.100">
            <TH>User</TH>
            <SortableTH
              column="earned"
              currentSort={currentSort}
              setSort={setSort}
            >
              $ Earned
            </SortableTH>
            <SortableTH
              column="rank"
              currentSort={currentSort}
              setSort={setSort}
            >
              # Rank
            </SortableTH>
            <SortableTH
              column="submissions"
              currentSort={currentSort}
              setSort={setSort}
            >
              Submissions
            </SortableTH>
            <SortableTH
              column="wins"
              currentSort={currentSort}
              setSort={setSort}
            >
              Wins
            </SortableTH>
            <TH>Skills</TH>
            <TH>Socials</TH>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {currentUsers.map((user) => (
            <MemberRow key={user.id} user={user} />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const MemberRow = ({ user }: { user: LocalMember }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const skills = user.skills.flatMap((skills: any) => skills.skills);
  const socialLinks = [
    { icon: '/assets/talent/telegram.png', link: user?.telegram },
    { icon: '/assets/talent/twitter.png', link: user?.twitter },
    { icon: '/assets/talent/site.png', link: user?.website },
  ];

  return (
    <Tr>
      <Td>
        <Flex align="center" cursor="pointer" onClick={onOpen}>
          <EarnAvatar size="36px" id={user?.id} avatar={user?.photo} />
          <Box display={{ base: 'none', md: 'block' }} ml={2}>
            <Text
              overflowX="hidden"
              w={'10rem'}
              color="brand.slate.700"
              fontSize="sm"
              fontWeight={500}
              _groupHover={{
                textDecoration: 'underline',
              }}
              textOverflow={'ellipsis'}
            >
              {`${user?.firstName} ${user?.lastName}`}
            </Text>
            <Text
              overflowX="hidden"
              maxW={'10rem'}
              color="brand.slate.500"
              fontSize="sm"
              fontWeight={500}
              _groupHover={{
                textDecoration: 'underline',
              }}
              textOverflow={'ellipsis'}
            >
              @{user?.username}
            </Text>
          </Box>
        </Flex>
        <UserDrawer isOpen={isOpen} onClose={onClose} user={user} />
      </Td>
      <Td>
        <Text
          w={'8rem'}
          color="brand.slate.700"
          fontSize={'0.9rem'}
          fontWeight={500}
        >
          $
          {user.totalEarnings.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </Text>
      </Td>
      <Td>
        <Text color="brand.slate.700" fontSize={'0.9rem'}>
          #{user?.rank}
        </Text>
      </Td>
      <Td>
        <Text color="brand.slate.700" fontSize={'0.9rem'}>
          {user?.totalSubmissions}
        </Text>
      </Td>
      <Td>
        <Text color="brand.slate.700" fontSize={'0.9rem'}>
          {user?.wins}
        </Text>
      </Td>
      <Td>
        <Flex gap={2} h="full" textAlign={'center'}>
          {skills.slice(0, 2).map((s: string) => (
            <Badge
              key={s}
              px={2}
              color="#64739C"
              fontSize={'x-small'}
              fontWeight={500}
              textTransform={'none'}
              bg="#EFF1F5"
              rounded="sm"
            >
              {s}
            </Badge>
          ))}
          {skills.length > 2 && (
            <Badge
              px={2}
              color="#64739C"
              fontSize={'x-small'}
              fontWeight={500}
              textTransform={'none'}
              bg="#EFF1F5"
              rounded="sm"
            >
              +{skills.length - 2}
            </Badge>
          )}
        </Flex>
      </Td>
      <Td>
        <Flex justify="flex-start" gap={4} minW={16}>
          {socialLinks.map((ele, eleIndex) => (
            <Box
              key={eleIndex}
              flexShrink={0}
              onClick={() => {
                if (ele.link) {
                  const formattedLink =
                    ele.link.startsWith('http://') ||
                    ele.link.startsWith('https://')
                      ? ele.link
                      : `https://${ele.link}`;
                  window.open(formattedLink, '_blank');
                }
              }}
            >
              <Image
                boxSize={4}
                opacity={!ele.link ? '0.3' : '1'}
                cursor={ele.link ? 'pointer' : 'default'}
                objectFit="contain"
                alt=""
                filter={!ele.link ? 'grayscale(100%)' : 'none'}
                src={ele.icon}
              />
            </Box>
          ))}
        </Flex>
      </Td>
      <Td>
        <Link
          as={NextLink}
          color="brand.slate.500"
          fontSize={'0.9rem'}
          fontWeight={500}
          href={`/t/${user.username}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          View Profile <ArrowForwardIcon />
        </Link>
      </Td>
    </Tr>
  );
};
