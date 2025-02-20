import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { UserFlag } from '@/components/shared/UserFlag';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type RowType, type SKILL } from '../types';
import { getSubskills, skillCategories } from '../utils';

import '/node_modules/flag-icons/css/flag-icons.min.css';

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
    <div
      className={cn(
        'hide-scrollbar w-full overflow-x-auto rounded-md border border-slate-200',
        rankings.length === 0 ? 'h-[35rem]' : 'h-auto',
        loading ? 'opacity-30' : 'opacity-100',
      )}
    >
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="normal-case">
            <TableHead className="px-1 text-center text-xs font-medium tracking-wider text-slate-500 normal-case md:px-2">
              Rank
            </TableHead>
            <TableHead className="px-1 text-left text-xs font-medium tracking-wider text-slate-500 normal-case md:px-2">
              Name
            </TableHead>
            <TableHead className="px-1 text-center text-xs font-medium tracking-wider text-slate-500 normal-case md:px-2">
              <p className="hidden whitespace-nowrap md:block">
                Dollars Earned
              </p>
              <p className="block whitespace-nowrap md:hidden">$ Earned</p>
            </TableHead>
            <TableHead className="px-1 text-center text-xs font-medium tracking-wider whitespace-nowrap text-slate-500 normal-case md:px-2">
              Win Rate
            </TableHead>
            <TableHead className="px-1 text-center text-xs font-medium tracking-wider text-slate-500 normal-case md:px-2">
              Wins
            </TableHead>
            <TableHead className="max-w-[3.5rem] truncate overflow-x-hidden px-1 text-center text-xs font-medium tracking-wider text-slate-500 normal-case md:max-w-none md:px-2">
              Submissions
            </TableHead>
            <TableHead
              className={cn(
                'px-1 text-left text-xs font-medium tracking-wider text-slate-500 normal-case md:px-2',
                skill !== 'ALL' ? 'hidden' : 'hidden md:table-cell',
              )}
            >
              Skills
            </TableHead>
          </TableRow>
        </TableHeader>
        {rankings.length === 0 && (
          <div className="absolute top-40 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
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
            </div>
            <div className="flex flex-col text-xs font-medium">
              <p>The Leaderboard is empty for your filters</p>
              <p className="text-slate-500">
                Please change your filters or try again later
              </p>
            </div>
          </div>
        )}
        {rankings.length > 0 && (
          <TableBody className="text-xs font-medium text-slate-500">
            {rankings.map((row) => (
              <TableRow
                key={row.username}
                className={cn(
                  'h-full',
                  row.username === user?.username ? 'bg-[#F5F3FF80]' : '',
                )}
              >
                <TableCell className="h-full px-1 text-center md:px-2">
                  #{row.rank}
                </TableCell>
                <TableCell className="h-full pr-8 sm:px-2">
                  <Link
                    href={`/t/${row.username}`}
                    target="_blank"
                    className="ph-no-capture flex items-center gap-2"
                    onClick={() => {
                      posthog.capture('profile click_leaderboard', {
                        clicked_username: row.username,
                      });
                    }}
                  >
                    <EarnAvatar avatar={row.pfp!} id={row.name} />
                    <div className="flex flex-col items-start justify-center gap-1 md:justify-start">
                      <p className="block max-w-[7rem] overflow-x-hidden text-ellipsis whitespace-nowrap text-black group-hover:underline md:hidden">
                        {row.name.split(' ')[0] +
                          ' ' +
                          row.name.split(' ')[1]?.slice(0, 1).toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="hidden overflow-x-hidden text-ellipsis whitespace-nowrap text-black md:block">
                          {row.name}
                        </p>
                        {row.location && (
                          <UserFlag size="12px" location={row.location} />
                        )}
                      </div>
                      <p className="hidden max-w-[7rem] truncate md:block">
                        @{row.username}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="h-full px-1 md:px-2">
                  <div className="flex justify-end gap-1 text-right">
                    <p className="text-black">
                      ${formatNumberWithSuffix(row.dollarsEarned)}
                    </p>
                    <p className="hidden md:block">USD</p>
                  </div>
                </TableCell>
                <TableCell className="h-full px-1 text-center md:px-2">
                  {row.winRate}%
                </TableCell>
                <TableCell className="h-full px-1 text-center md:px-2">
                  {row.wins}
                </TableCell>
                <TableCell className="h-full px-1 text-center md:px-2">
                  {row.submissions}
                </TableCell>
                <TableCell
                  className={cn(
                    'h-full px-1 md:px-2',
                    skill !== 'ALL' ? 'hidden' : 'hidden md:table-cell',
                  )}
                >
                  <div className="flex h-full gap-2 text-center">
                    {row.skills.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="text-xxs rounded-full bg-[#EFF1F5] px-2 py-0.5 font-medium whitespace-nowrap text-[#64739C]"
                      >
                        {s}
                      </span>
                    ))}
                    {row.skills.length > 2 && (
                      <Popover>
                        <PopoverTrigger>
                          <span className="text-xxs rounded-full bg-[#EFF1F5] px-2 py-0.5 font-medium whitespace-nowrap text-[#64739C]">
                            +{row.skills.length - 2}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-fit max-w-40 px-4 py-2 shadow-lg"
                          align="center"
                        >
                          <div className="flex h-full w-fit flex-wrap gap-2 text-center">
                            {row.skills.slice(2).map((s) => (
                              <span
                                key={s}
                                className="text-xxs rounded-full bg-[#EFF1F5] px-2 py-0.5 font-medium whitespace-nowrap text-[#64739C]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {user && !rankings.find((r) => r.username === user?.username) && (
              <TableRow className="w-full bg-[#F5F3FF80]">
                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 text-center md:px-2">
                  {userRank ? '#' + userRank.rank : '-'}
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 md:px-2">
                  <Link
                    className="ph-no-capture flex items-center gap-2"
                    href={`/t/${user.username}`}
                    onClick={() => {
                      posthog.capture('profile click_leaderboard', {
                        clicked_username: user.username,
                      });
                    }}
                    target="_blank"
                  >
                    <EarnAvatar avatar={user.photo} id={user.firstName} />
                    <div className="flex flex-col items-start justify-center gap-1 md:justify-start">
                      <p className="block max-w-[7rem] overflow-x-hidden text-ellipsis whitespace-nowrap text-black group-hover:underline md:hidden">
                        {user.firstName +
                          ' ' +
                          user.lastName?.slice(0, 1).toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="line-clamp-1 hidden max-w-[7rem] overflow-x-hidden text-ellipsis whitespace-nowrap text-black md:block">
                          {user.firstName + ' ' + user.lastName}
                        </p>
                        {user.location && (
                          <UserFlag size="12px" location={user.location} />
                        )}
                      </div>
                      <p className="hidden max-w-[7rem] overflow-x-hidden text-ellipsis md:block">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 md:px-2">
                  <div className="flex justify-end gap-1 text-right">
                    <p className="text-black">
                      ${formatNumberWithSuffix(userRank?.dollarsEarned ?? 0)}
                    </p>
                    <p className="hidden md:block">USD</p>
                  </div>
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 text-center md:px-2">
                  {userRank?.winRate ? userRank?.winRate + '%' : '-'}
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 text-center md:px-2">
                  {userRank?.wins ?? '-'}
                </TableCell>

                <TableCell className="sticky bottom-0 z-100 border-b-0 px-1 text-center md:px-2">
                  {userRank?.submissions ?? '-'}
                </TableCell>

                <TableCell
                  className={cn(
                    'bottom-0 border-b-0 px-1 md:px-2',
                    skill !== 'ALL' ? 'hidden' : 'hidden md:table-cell',
                  )}
                >
                  <div className="flex h-full gap-2 text-center">
                    {userSkills.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="text-xxs rounded-full bg-[#EFF1F5] px-2 py-0.5 font-medium whitespace-nowrap text-[#64739C]"
                      >
                        {s}
                      </span>
                    ))}
                    {userSkills.length > 2 && (
                      <Popover>
                        <PopoverTrigger>
                          <span className="text-xxs rounded-full bg-[#EFF1F5] px-2 py-0.5 font-medium whitespace-nowrap text-[#64739C]">
                            +{userSkills.length - 2}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-fit max-w-40 px-4 py-2 shadow-lg"
                          align="center"
                        >
                          <div className="flex h-full w-fit flex-wrap gap-2 text-center">
                            {userSkills.slice(2).map((s) => (
                              <span
                                key={s}
                                className="text-xxs rounded-full bg-[#EFF1F5] px-2 py-0.5 font-medium whitespace-nowrap text-[#64739C]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
