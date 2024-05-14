import { Box, Flex, VStack } from '@chakra-ui/react';
import {
  type TalentRankingSkills,
  type TalentRankingTimeframe,
} from '@prisma/client';
import axios from 'axios';
import { type GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next';
import { useEffect, useState, useTransition } from 'react';

import { TotalStats } from '@/components/home/TotalStats';
import {
  Banner,
  ComingSoon,
  FilterRow,
  getSubskills,
  Introduction,
  Pagination,
  RanksTable,
  type RowType,
  type SKILL,
  skillCategories,
  type TIMEFRAME,
} from '@/features/leaderboard';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';

import { authOptions } from '../../pages/api/auth/[...nextauth]';

interface TotalType {
  count?: number;
  totalInUSD?: number;
  totalUsers?: number;
}

interface Props {
  results: RowType[];
  skill: SKILL;
  timeframe: TIMEFRAME;
  page: number;
  count: number;
  userRank: RowType | null;
}

function TalentLeaderboard({
  results,
  skill: curSkill,
  timeframe: curTimeframe,
  page: curPage,
  count,
  userRank,
}: Props) {
  const [isTotalLoading, setIsTotalLoading] = useState(true);
  const [totals, setTotals] = useState<TotalType>({});

  const [timeframe, setTimeframe] = useState<TIMEFRAME>(curTimeframe);
  const [skill, setSkill] = useState<SKILL>(curSkill);
  const [page, setPage] = useState(curPage);
  const [loading, setLoading] = useState(false);

  const [, startTransition] = useTransition();
  const router = useRouter();

  const getTotalInfo = async () => {
    try {
      const totalsData = await axios.get('/api/sidebar/totals');
      setTotals(totalsData.data);
      setIsTotalLoading(false);
    } catch (e) {
      setIsTotalLoading(false);
    }
  };

  const handleStart = (url: string) => {
    if (url !== router.asPath) {
      setLoading(true);
    }
  };

  const handleComplete = (url: string) => {
    if (url === router.asPath) {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  useEffect(() => {
    getTotalInfo();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get('skill') !== skill)
      url.searchParams.set('skill', skill);

    if (url.searchParams.get('timeframe') !== timeframe)
      url.searchParams.set('timeframe', timeframe);

    if (Number(url.searchParams.get('page')) !== page)
      url.searchParams.set('page', String(page));

    startTransition(() => {
      router.replace(`?${url.searchParams.toString()}`, undefined, {
        scroll: false,
      });
    });
  }, [skill, timeframe, page]);

  return (
    <Default
      meta={
        <Meta
          title={`Talent Leaderboard | Superteam Earn`}
          description={`Talent Leaderboard | Superteam Earn`}
        />
      }
    >
      <Box overflow="hidden" pb={20} bg="white">
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
              w="full"
            >
              <Introduction />
            </VStack>
            <VStack align="start" w={'100%'}>
              <FilterRow
                skill={skill}
                setSkill={(value: SKILL) => setSkill(value)}
                timeframe={timeframe}
                setTimeframe={(value: TIMEFRAME) => setTimeframe(value)}
              />
              <RanksTable
                loading={loading}
                userRank={userRank}
                skill={skill}
                rankings={results}
              />
              <Pagination
                count={count}
                page={page}
                setPage={(v: number) => setPage(v)}
              />
            </VStack>
          </VStack>
          <VStack
            gap={6}
            display={{ base: 'none', md: 'flex' }}
            w={{ md: '30%' }}
          >
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

export const getServerSideProps: GetServerSideProps = async ({
  query,
  req,
  res,
}) => {
  const skill = (query.skill || 'ALL') as TalentRankingSkills;
  const timeframe = (query.timeframe || 'ALL_TIME') as TalentRankingTimeframe;
  let page = Number(query.page) || 1;
  if (page < 1) page = 1;

  const session = await getServerSession(req, res, authOptions);

  const PAGE_SIZE = 10;

  const count = await prisma.talentRankings.count({
    where: {
      skill,
      timeframe,
    },
  });
  const totalPages = Math.ceil(count / PAGE_SIZE);
  if (page < 1 || page > totalPages) {
    page = 1;
  }
  const results = await prisma.talentRankings.findMany({
    where: {
      skill,
      timeframe,
    },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    orderBy: {
      rank: 'asc',
    },
    include: {
      user: {
        select: {
          photo: true,
          firstName: true,
          lastName: true,
          username: true,
          skills: true,
        },
      },
    },
  });

  let userRank: (typeof results)[0] | null = null;
  let formatterUserRank: RowType | null = null;
  if (session && !results.find((c) => c.userId === session.user.id)) {
    userRank = await prisma.talentRankings.findFirst({
      where: {
        skill,
        timeframe,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            photo: true,
            firstName: true,
            lastName: true,
            username: true,
            skills: true,
          },
        },
      },
    });
    if (userRank) {
      formatterUserRank = {
        rank: userRank.rank,
        skills: getSubskills(
          userRank.user.skills as any,
          skillCategories[skill],
        ),
        username: userRank.user.username,
        name: userRank.user.firstName + ' ' + userRank.user.lastName,
        pfp: userRank.user.photo,
        dollarsEarned: userRank.totalEarnedInUSD,
        winRate: userRank.winRate,
        submissions: userRank.submissions,
        wins: userRank.wins,
      };
    }
  }

  const formatted: RowType[] = results.map((r) => {
    return {
      rank: r.rank,
      skills: getSubskills(r.user.skills as any, skillCategories[skill]),
      username: r.user.username,
      pfp: r.user.photo,
      dollarsEarned: r.totalEarnedInUSD,
      name: r.user.firstName + ' ' + r.user.lastName,
      submissions: r.submissions,
      wins: r.wins,
      winRate: r.winRate,
    };
  });

  return {
    props: {
      results: formatted,
      skill,
      timeframe,
      page,
      count,
      userRank: formatterUserRank,
    },
  };
};
