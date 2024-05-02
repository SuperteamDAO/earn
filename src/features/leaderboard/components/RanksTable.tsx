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

interface RowType {
  rank: number;
  name: string;
  pfp: string;
  username: string;
  dollarsEarned: number;
  submissions: number;
  wins: number;
  winRate: number;
  skills: string[];
}

const exampleRows: RowType[] = [
  {
    rank: 1,
    name: 'Pratik Das',
    pfp: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1711903030/vrcpbrhpfarikmpaz5go.jpg',
    username: 'pratikdas',
    dollarsEarned: 10000,
    submissions: 23,
    wins: 45,
    winRate: 25,
    skills: ['React', 'Next.js', 'Sveltekit'],
  },
  {
    rank: 2,
    name: 'Pratik Das',
    pfp: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1711903030/vrcpbrhpfarikmpaz5go.jpg',
    username: 'pratikdas',
    dollarsEarned: 10000,
    submissions: 23,
    wins: 45,
    winRate: 25,
    skills: ['React', 'Next.js'],
  },
];

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  maximumFractionDigits: 0,
  currency: 'USD',
}).format;

export function RanksTable() {
  return (
    <TableContainer overflowX="auto" overflowY="hidden" w="full">
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
          {exampleRows.map((row) => (
            <Tr key={row.username}>
              <Td textAlign={'center'}>#{row.rank}</Td>
              <Td align="center" gap={2} display="flex">
                <Avatar w={8} h={8} src={row.pfp} />
                <VStack align="start" lineHeight={0.7}>
                  <Text color="black">{row.name}</Text>
                  <Text>@{row.username}</Text>
                </VStack>
              </Td>
              <Td>
                <Flex justify="center" gap={2}>
                  <Text color="black" textAlign={'center'}>
                    {formatter(row.dollarsEarned)}
                  </Text>
                  <Text textAlign={'center'}>USD</Text>
                </Flex>
              </Td>
              <Td textAlign={'center'}>{row.submissions}</Td>
              <Td textAlign={'center'}>{row.wins}</Td>
              <Td textAlign={'center'}>{row.winRate}</Td>
              <Td textAlign={'center'}>
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
