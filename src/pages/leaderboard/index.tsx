import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { type PrismaUserWithoutKYC } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import {
  type TalentRankingSkills,
  type TalentRankingTimeframe,
} from '@/prisma/enums';
import { type TalentRankingsWhereInput } from '@/prisma/models/TalentRankings';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { TotalStats } from '@/features/home/components/TotalStats';
import { totalsQuery } from '@/features/home/queries/totals';
import { Banner } from '@/features/leaderboard/components/Banner';
import { FilterRow } from '@/features/leaderboard/components/FilterRow';
import { Introduction } from '@/features/leaderboard/components/Introduction';
import { Pagination } from '@/features/leaderboard/components/Pagination';
import { RanksTable } from '@/features/leaderboard/components/RanksTable';
import {
  type RowType,
  type SKILL,
  type TIMEFRAME,
} from '@/features/leaderboard/types';
import { getSubskills, skillCategories } from '@/features/leaderboard/utils';

interface Props {
  results: RowType[];
  skill: SKILL;
  timeframe: TIMEFRAME;
  page: number;
  count: number;
  userRank: RowType | null;
  search?: string;
}

function TalentLeaderboard({
  results,
  skill: curSkill,
  timeframe: curTimeframe,
  page: curPage,
  count,
  userRank,
  search: curSearch,
}: Props) {
  const { data: totals, isLoading: isTotalsLoading } = useQuery(totalsQuery);

  const [timeframe, setTimeframe] = useState<TIMEFRAME>(curTimeframe);
  const [skill, setSkill] = useState<SKILL>(curSkill);
  const [page, setPage] = useState(curPage);
  const [search, setSearch] = useState(curSearch || '');
  const [loading, setLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleComplete = (): void => {
    setLoading(false);
    setIsSearchLoading(false);
  };

  useEffect(() => {
    return () => {
      setLoading(false);
      setIsSearchLoading(false);
    };
  }, []);

  useEffect(() => {
    // When pathname or search params change, consider navigation completed for loading UI
    handleComplete();
  }, [pathname, searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());
    if (params.get('skill') !== skill) params.set('skill', skill);
    if (params.get('timeframe') !== timeframe)
      params.set('timeframe', timeframe);
    if (Number(params.get('page')) !== page) params.set('page', String(page));
    if (params.get('search') !== search) params.set('search', search);

    const qs = params.toString();
    startTransition(() => {
      router.replace(`?${qs}`, { scroll: false });
    });
  }, [skill, timeframe, page, search, searchParams, router, startTransition]);

  return (
    <Default
      meta={
        <Meta
          title={`Talent Leaderboard | Superteam Earn`}
          description={`Talent Leaderboard | Superteam Earn`}
        />
      }
    >
      <HomepagePop />
      <div className="overflow-hidden bg-white pb-20">
        <div className="mx-auto flex max-w-7xl gap-4 px-1 py-4 sm:px-3 md:gap-8">
          <div className="flex w-full flex-col items-start gap-4 md:w-[70%] md:gap-8">
            <Banner />
            <div className="flex w-full flex-col gap-4 md:hidden md:gap-8">
              <Introduction />
            </div>
            <div className="flex w-full flex-col items-start gap-3">
              <FilterRow
                skill={skill}
                setSkill={(value: SKILL) => setSkill(value)}
                timeframe={timeframe}
                setTimeframe={(value: TIMEFRAME) => setTimeframe(value)}
                onSearch={setSearch}
                isSearchLoading={isSearchLoading}
                search={curSearch || ''}
              />
              <RanksTable
                loading={loading}
                userRank={userRank}
                skill={skill}
                rankings={results}
                search={search}
              />
              <Pagination
                count={count}
                page={page}
                setPage={(v: number) => setPage(v)}
              />
            </div>
          </div>
          <div className="hidden flex-col gap-6 md:flex md:w-[30%]">
            <TotalStats
              TVE={totals?.totalInUSD ?? 0}
              bountyCount={totals?.count ?? 0}
              isTotalLoading={isTotalsLoading}
            />
            <Introduction />
          </div>
        </div>
      </div>
    </Default>
  );
}

export default TalentLeaderboard;

export const getServerSideProps: GetServerSideProps = async ({
  query,
  req,
}) => {
  const skill = (query.skill || 'ALL') as TalentRankingSkills;
  const timeframe = (query.timeframe || 'ALL_TIME') as TalentRankingTimeframe;
  const search = (query.search as string) || '';
  let page = Number(query.page) || 1;
  if (page < 1) page = 1;

  const privyDid = await getPrivyToken(req);
  let user: PrismaUserWithoutKYC | null = null;

  if (privyDid) {
    user = (await prisma.user.findUnique({
      where: { privyDid },
    })) as PrismaUserWithoutKYC | null;
  }

  const PAGE_SIZE = 10;

  const whereClause: TalentRankingsWhereInput = {
    skill,
    timeframe,
    ...(search
      ? {
          OR: [
            { user: { username: { contains: search } } },
            { user: { firstName: { contains: search } } },
            { user: { lastName: { contains: search } } },
          ],
        }
      : {}),
  };

  const count = await prisma.talentRankings.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(count / PAGE_SIZE);
  if (page < 1 || page > totalPages) {
    page = 1;
  }
  const results = await prisma.talentRankings.findMany({
    where: whereClause,
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
          location: true,
        },
      },
    },
  });

  let userRank: (typeof results)[0] | null = null;
  let formatterUserRank: RowType | null = null;
  if (user && !results.find((c) => c.userId === user?.id)) {
    userRank = await prisma.talentRankings.findFirst({
      where: {
        skill,
        timeframe,
        userId: user?.id,
      },
      include: {
        user: {
          select: {
            photo: true,
            firstName: true,
            lastName: true,
            username: true,
            skills: true,
            location: true,
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

  return {
    props: {
      results: results.map((result) => ({
        rank: result.rank,
        skills: getSubskills(result.user.skills as any, skillCategories[skill]),
        username: result.user.username,
        name: result.user.firstName + ' ' + result.user.lastName,
        pfp: result.user.photo,
        dollarsEarned: result.totalEarnedInUSD,
        winRate: result.winRate,
        submissions: result.submissions,
        wins: result.wins,
      })),
      skill,
      timeframe,
      page,
      count,
      userRank: formatterUserRank,
      search,
    },
  };
};
