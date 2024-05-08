import {
  Avatar,
  Badge,
  Flex,
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

import { type RowType } from '../types';

interface ColumnType {
  label: string;
  align?: 'center' | 'start';
  paddingX?:
    | {
        base: number;
        md: number;
      }
    | number;
  display?: {
    base: string;
    md: string;
  };
}

const headColumns: ColumnType[] = [
  {
    label: 'Rank',
    align: 'center',
    paddingX: { base: 1, md: 2 },
  },
  {
    label: 'Name',
    align: 'start',
    paddingX: { base: 1, md: 2 },
  },
  {
    label: 'Dollars Earned',
    align: 'center',
    paddingX: { base: 1, md: 2 },
  },
  {
    label: 'Win Rate',
    align: 'center',
    paddingX: { base: 1, md: 2 },
  },
  {
    label: 'Submissions',
    align: 'center',
    paddingX: { base: 1, md: 2 },
  },
  {
    label: 'Wins',
    align: 'center',
    paddingX: { base: 1, md: 2 },
  },
  {
    label: 'Skills',
    align: 'start',
    paddingX: 1,
    display: { base: 'none', md: 'block' },
  },
];

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  maximumFractionDigits: 0,
  currency: 'USD',
}).format;

interface Props {
  rankings: RowType[];
}

export function RanksTable({ rankings }: Props) {
  return (
    <TableContainer
      className="hide-scrollbar"
      overflowX="auto"
      overflowY="hidden"
      w="full"
      border="1px solid #E2E8F0"
      borderRadius="md"
    >
      <Table>
        <Thead>
          <Tr textTransform={'none'} bg="#F8FAFC">
            {headColumns.map((head) => (
              <Th
                key={head.label}
                display={head.display}
                px={head.paddingX}
                color="brand.slate.500"
                fontSize={'xs'}
                fontWeight={500}
                letterSpacing={0.5}
                textAlign={head.align ?? 'left'}
                textTransform={'none'}
              >
                {head.label}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody color="brand.slate.500" fontSize="xs" fontWeight={500}>
          {rankings.map((row, i) => (
            <Tr key={row.username} h="full">
              <Td
                h="full"
                px={headColumns[0]?.paddingX}
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                #{row.rank}
              </Td>
              <Td
                h="full"
                px={headColumns[0]?.paddingX}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                <Flex align="center" gap={2}>
                  <Avatar
                    w={{ base: 5, md: 8 }}
                    h={{ base: 5, md: 8 }}
                    src={row.pfp ?? undefined}
                  />
                  <VStack
                    align="start"
                    justify={{ base: 'center', md: 'start' }}
                    gap={1}
                    lineHeight={1}
                  >
                    <Text
                      display={{ base: 'block', md: 'none' }}
                      overflowX="hidden"
                      maxW={'7rem'}
                      color="black"
                      textOverflow={'ellipsis'}
                    >
                      {row.name.split(' ')[0] +
                        ' ' +
                        row.name.split(' ')[1]?.slice(0, 1).toUpperCase()}
                    </Text>
                    <Text
                      display={{ base: 'none', md: 'block' }}
                      overflowX="hidden"
                      maxW={'7rem'}
                      color="black"
                      textOverflow={'ellipsis'}
                    >
                      {row.name}
                    </Text>
                    <Text
                      display={{ base: 'none', md: 'block' }}
                      overflowX="hidden"
                      maxW={'7rem'}
                      textOverflow={'ellipsis'}
                    >
                      @{row.username}
                    </Text>
                  </VStack>
                </Flex>
              </Td>
              <Td
                h="full"
                px={headColumns[0]?.paddingX}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                <Flex
                  justify="center"
                  gap={2}
                  fontSize={{ base: 'xs', md: 'sm' }}
                >
                  <Text color="black" textAlign={'center'}>
                    {formatter(row.dollarsEarned)}
                  </Text>
                  <Text textAlign={'center'}>USD</Text>
                </Flex>
              </Td>
              <Td
                h="full"
                px={headColumns[0]?.paddingX}
                fontSize={{ base: 'xs', md: 'sm' }}
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                {row.winRate}%
              </Td>
              <Td
                h="full"
                px={headColumns[0]?.paddingX}
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                {row.submissions}
              </Td>
              <Td
                h="full"
                px={headColumns[0]?.paddingX}
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                {row.wins}
              </Td>
              <Td
                display={{ base: 'none', md: 'table-cell' }}
                h="full"
                px={headColumns[0]?.paddingX}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                <Flex gap={2} h="full" textAlign={'center'}>
                  {row.skills.slice(0, 2).map((s) => (
                    <Badge
                      key={s}
                      px={2}
                      color="#64739C"
                      fontSize={'xx-small'}
                      fontWeight={500}
                      textTransform={'none'}
                      bg="#EFF1F5"
                      rounded="full"
                    >
                      {s}
                    </Badge>
                  ))}
                  {row.skills.length > 2 && (
                    <Badge
                      px={2}
                      color="#64739C"
                      fontSize={'xx-small'}
                      fontWeight={500}
                      textTransform={'none'}
                      bg="#EFF1F5"
                      rounded="full"
                    >
                      +{row.skills.length - 2}
                    </Badge>
                  )}
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
