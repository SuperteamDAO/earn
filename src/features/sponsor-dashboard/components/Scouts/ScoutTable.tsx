import { Info } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { skillMap } from '@/constants/skillMap';
import { EarnAvatar } from '@/features/talent';
import { cn } from '@/utils';

import { type ScoutRowType } from '../../types';
import { InviteButton } from './InviteButton';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  maximumFractionDigits: 0,
  currency: 'USD',
}).format;

const MAX_SHOW_SKILLS = 5;

interface Props {
  bountyId: string;
  scouts: ScoutRowType[];
  setInvited: (userId: string) => void;
}

export function ScoutTable({ bountyId, scouts, setInvited }: Props) {
  const posthog = usePostHog();
  const invitedCount = scouts.filter((scout) => scout.invited).length;
  const MAX_INVITES = scouts.length;
  const maxInvitesReached = invitedCount >= MAX_INVITES;

  const invitesLeft = MAX_INVITES - invitedCount;

  return (
    <div
      className={cn(
        'h-auto w-full overflow-x-auto rounded-md border border-gray-200',
        scouts.length === 0 ? 'h-25rem' : 'h-auto',
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-[#f8fafc]">
            <TableHead className="text-xs font-medium text-slate-500">
              User
            </TableHead>
            <TableHead className="px-1 text-center text-xs font-medium text-slate-500 md:px-2">
              <div className="flex items-center justify-center gap-2">
                $ Earned
                <Tooltip
                  content={
                    <p>$ Earned across all relevant skills for this listing.</p>
                  }
                  contentProps={{ className: 'text-xs' }}
                >
                  <Info className="hidden h-3 w-3 md:block" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="px-1 text-center text-xs font-medium text-slate-500 md:px-2">
              <div className="flex items-center justify-center gap-2">
                Match Score
                <Tooltip
                  content={
                    <p>
                      An aggregate score based on multiple factors such as
                      number of matched skills, $ earned, etc.
                    </p>
                  }
                  contentProps={{ className: 'text-xs' }}
                >
                  <Info className="hidden h-3 w-3 md:block" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="px-1 text-left text-xs font-medium text-slate-500 md:px-2">
              <div className="flex items-center justify-center gap-2">
                Matched Skills
                <Tooltip
                  content={
                    <p>
                      Matched Skills refer to the skills of the listings the
                      users have previously won.
                    </p>
                  }
                  contentProps={{ className: 'text-xs' }}
                >
                  <Info className="hidden h-3 w-3 md:block" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="px-1 text-left text-xs font-medium text-slate-500 md:px-2">
              Invites Left: {invitesLeft}/{MAX_INVITES}
            </TableHead>
          </TableRow>
        </TableHeader>
        {scouts.length === 0 && (
          <div className="absolute left-1/2 top-48 flex -translate-x-1/2 flex-col items-center gap-3">
            <div className="flex items-center justify-center rounded-full bg-slate-100 p-5">
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
            </div>
            <div className="flex flex-col items-center gap-0 text-base">
              <p className="font-semibold">No Profiles Found</p>
              <p className="font-normal text-slate-500">
                We couldn’t find any suitable matches for your listing.
              </p>
            </div>
          </div>
        )}
        {scouts.length > 0 && (
          <TableBody className="text-sm font-medium text-slate-500">
            {scouts.map((scout) => (
              <TableRow key={scout.id + scout.invited}>
                <TableCell className="h-full w-fit text-xs">
                  <Link
                    className="ph-no-capture flex items-center gap-2"
                    href={`/t/${scout.username}`}
                    onClick={() => {
                      posthog.capture('profile click_scouts', {
                        clicked_username: scout.username,
                      });
                    }}
                    target="_blank"
                  >
                    <EarnAvatar id={scout.id} avatar={scout.pfp || undefined} />
                    <div className="align-start flex flex-col justify-center gap-1 md:justify-start">
                      <div className="flex gap-1">
                        <p className="max-w-[14rem] overflow-hidden text-ellipsis text-xs text-slate-800">
                          {scout.name}
                        </p>
                        {scout.recommended && (
                          <Tooltip
                            content={<p>Superteam Recommended</p>}
                            contentProps={{ className: 'text-xs' }}
                          >
                            <LocalImage
                              src="/assets/sparkle.svg"
                              alt="sparkle"
                            />
                          </Tooltip>
                        )}
                      </div>
                      <p className="max-w-[7rem] overflow-x-hidden text-ellipsis">
                        @{scout.username}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="h-full px-1 md:px-2">
                  <div className="flex justify-center gap-2">
                    <p className="text-center text-black">
                      {formatter(scout.dollarsEarned)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="h-full px-1 md:px-2">
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-center text-black">{scout.score}</p>
                    <ScoreBar score={scout.score} />
                  </div>
                </TableCell>
                <TableCell className="h-full px-1 md:px-2">
                  <div className="flex h-full gap-2 text-center">
                    {scout.skills.slice(0, MAX_SHOW_SKILLS).map((s) => {
                      const skillColor =
                        skillMap.find((e) => e.mainskill === s)?.color ||
                        '#64739C';
                      const bgColor = skillMap.find((e) => e.mainskill === s)
                        ? `${skillMap.find((e) => e.mainskill === s)?.color}1A`
                        : '#EFF1F5';

                      return (
                        <span
                          key={s}
                          className="inline-flex px-2 text-xs font-medium"
                          style={{
                            color: skillColor,
                            backgroundColor: bgColor,
                          }}
                        >
                          {s}
                        </span>
                      );
                    })}

                    {scout.skills.length > MAX_SHOW_SKILLS && (
                      <Popover>
                        <PopoverTrigger>
                          <span className="inline-flex rounded-full bg-[#EFF1F5] px-2 text-xs font-medium text-[#64739C]">
                            +{scout.skills.length - MAX_SHOW_SKILLS}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-fit max-w-40 px-4 py-2 shadow-lg">
                          <div className="flex h-full w-fit flex-wrap gap-2 text-center">
                            {scout.skills.slice(MAX_SHOW_SKILLS).map((s) => (
                              <span
                                key={s}
                                className="inline-flex rounded-full bg-[#EFF1F5] px-2 text-xs font-medium text-[#64739C]"
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
                <TableCell className="items-left pl-0">
                  <div className="flex h-8 items-start gap-2">
                    <Link
                      className="ph-no-capture block h-full"
                      href={`/t/${scout.username}`}
                      onClick={() => {
                        posthog.capture('view profile_scouts', {
                          clicked_username: scout.username,
                        });
                      }}
                      target="_blank"
                    >
                      <Button className="h-full text-xs" variant="ghost">
                        View Profile
                      </Button>
                    </Link>
                    <InviteButton
                      setInvited={setInvited}
                      userId={scout.userId}
                      invited={scout.invited}
                      bountyId={bountyId}
                      maxInvitesReached={maxInvitesReached}
                      invitesLeft={invitesLeft}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const first = normalizeValue(score, 5, 6),
    second = normalizeValue(score, 6, 7),
    third = normalizeValue(score, 7, 10);

  const getColor = (score: number) => {
    if (score > 7) return '#0D9488';
    if (score > 6) return '#84CC16';
    return '#FDBA74';
  };

  return (
    <div className="flex h-2 gap-0.5">
      {[first, second, third].map((value, index) => (
        <Progress
          key={index}
          value={value}
          color={getColor(score)}
          className="h-full w-4 rounded-none"
        />
      ))}
    </div>
  );
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
