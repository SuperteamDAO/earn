import { Box, Flex, VStack } from '@chakra-ui/react';
import {
  type TalentRankingSkills,
  type TalentRankingTimeframes,
} from '@prisma/client';
import axios from 'axios';
import { type GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import { TotalStats } from '@/components/home/TotalStats';
import {
  Banner,
  ComingSoon,
  FilterRow,
  getSubskills,
  Introduction,
  RanksTable,
  type RowType,
  type Timeframe,
} from '@/features/leaderboard';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';

interface TotalType {
  count?: number;
  totalInUSD?: number;
  totalUsers?: number;
}

interface Props {
  results: RowType[];
}

function TalentLeaderboard({ results }: Props) {
  const [isTotalLoading, setIsTotalLoading] = useState(true);
  const [totals, setTotals] = useState<TotalType>({});

  const [timeframe, setTimeframe] = useState<Timeframe>('this_year');
  // const [status, setStatus] = useState<Status>('overall_rankings');

  const getTotalInfo = async () => {
    try {
      const totalsData = await axios.get('/api/sidebar/totals');
      setTotals(totalsData.data);
      setIsTotalLoading(false);
    } catch (e) {
      setIsTotalLoading(false);
    }
  };

  useEffect(() => {
    getTotalInfo();
  }, []);

  return (
    <Default
      meta={
        <Meta
          title={`Talent Leaderboard | Superteam Earn`}
          description={`Talent Leaderboard | Superteam Earn`}
        />
      }
    >
      <Box overflow="hidden" bg="white">
        <Flex
          gap={{ base: 4, md: 8 }}
          maxW={'7xl'}
          mx="auto"
          px={{ base: 3, md: 4 }}
          py={{ base: 4 }}
        >
          <VStack
            align="start"
            gap={{ base: 4, md: 8 }}
            w={{ base: '100%', md: '70%' }}
          >
            <Banner />
            <VStack
              gap={{ base: 4, md: 8 }}
              display={{ base: 'flex', md: 'none' }}
            >
              <Introduction />
              <ComingSoon />
            </VStack>
            <VStack w={'100%'}>
              <FilterRow
                timeframe={timeframe}
                setTimeframe={(value: Timeframe) => setTimeframe(value)}
              />
              <RanksTable rankings={results} />
            </VStack>
          </VStack>
          <VStack display={{ base: 'none', md: 'block' }} w={{ md: '30%' }}>
            <TotalStats
              TVE={totals?.totalInUSD ?? 0}
              bountyCount={totals?.count ?? 0}
              isTotalLoading={isTotalLoading}
            />
            <Introduction />
            <ComingSoon />
          </VStack>
        </Flex>
      </Box>
    </Default>
  );
}

export default TalentLeaderboard;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const skill = (query.skill || 'ALL') as TalentRankingSkills;
  const timeframe = (query.timeframe || 'THIS_YEAR') as TalentRankingTimeframes;
  const page = Number(query.page) || 1;

  const results = await prisma.talentRankings.findMany({
    where: {
      skill,
      timeframe,
    },
    skip: (page - 1) * 10,
    take: 10,
    include: {
      user: {
        select: {
          photo: true,
          firstName: true,
          lastName: true,
          username: true,
          skills: true,
          totalEarnedInUSD: true,
        },
      },
    },
  });

  const formatted: RowType[] = results.map((r) => ({
    rank: r.rank,
    skills: getSubskills(r.user.skills as any, skill),
    username: r.user.username,
    pfp: r.user.photo,
    dollarsEarned: r.user.totalEarnedInUSD,
    name: r.user.firstName + ' ' + r.user.lastName,
    submissions: r.submissions,
    wins: r.wins,
    winRate: r.winRate,
  }));

  return {
    props: {
      results: formatted,
    },
  };
};
