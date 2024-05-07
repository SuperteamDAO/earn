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
}

const headColumns: ColumnType[] = [
  {
    label: 'Rank',
    align: 'center',
  },
  {
    label: 'Name',
    align: 'start',
  },
  {
    label: 'Dollars Earned',
    align: 'center',
  },
  {
    label: 'Submissions',
    align: 'center',
  },
  {
    label: 'Wins',
    align: 'center',
  },
  {
    label: 'Win Rate',
    align: 'center',
  },
  {
    label: 'Skills',
    align: 'start',
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
                color="brand.slate.500"
                fontSize={'xs'}
                fontWeight={500}
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
            <Tr key={row.username}>
              <Td
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                #{row.rank}
              </Td>
              <Td
                align="center"
                gap={2}
                display="flex"
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                <Avatar w={8} h={8} src={row.pfp ?? undefined} />
                <VStack align="start" lineHeight={0.7}>
                  <Text color="black">{row.name}</Text>
                  <Text>@{row.username}</Text>
                </VStack>
              </Td>
              <Td borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}>
                <Flex justify="center" gap={2}>
                  <Text color="black" textAlign={'center'}>
                    {formatter(row.dollarsEarned)}
                  </Text>
                  <Text textAlign={'center'}>USD</Text>
                </Flex>
              </Td>
              <Td
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                {row.submissions}
              </Td>
              <Td
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                {row.wins}
              </Td>
              <Td
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                {row.winRate}
              </Td>
              <Td
                textAlign={'center'}
                borderBottomWidth={i === rankings.length - 1 ? '0px' : '1px'}
              >
                <Flex gap={2}>
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
                      +2
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
