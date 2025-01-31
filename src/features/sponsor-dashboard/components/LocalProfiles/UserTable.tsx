import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import React, { type ReactNode } from 'react';

import { SortableTH } from '@/components/shared/sortable-th';
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
import { useDisclosure } from '@/hooks/use-disclosure';
import { cn } from '@/utils/cn';

import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type LocalProfile } from '../../queries/local-profiles';
import { UserDrawer } from './UserDrawer';

interface SortState {
  column: string;
  direction: 'asc' | 'desc' | null;
}

interface MembersTableProps {
  currentUsers: LocalProfile[];
  currentSort: SortState;
  setSort: (column: string, direction: 'asc' | 'desc' | null) => void;
}

export interface THProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

const thClassName = 'text-xs font-medium tracking-wider text-slate-500';

const TH = ({ children, className, ...props }: THProps) => {
  return (
    <TableHead className={cn(thClassName, className)} {...props}>
      {children}
    </TableHead>
  );
};

export const UserTable = ({
  currentUsers,
  currentSort,
  setSort,
}: MembersTableProps) => {
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-100">
            <SortableTH
              column="rank"
              currentSort={currentSort}
              setSort={setSort}
              className={cn(thClassName, 'justify-center pr-2')}
            >
              # Rank
            </SortableTH>
            <SortableTH
              column="user"
              currentSort={currentSort}
              setSort={setSort}
              className={cn(thClassName)}
            >
              User
            </SortableTH>
            <SortableTH
              column="earned"
              currentSort={currentSort}
              setSort={setSort}
              className={cn(thClassName, 'px-1')}
            >
              $ Earned
            </SortableTH>
            <SortableTH
              column="submissions"
              currentSort={currentSort}
              setSort={setSort}
              className={cn(thClassName, 'justify-center px-0')}
            >
              Submissions
            </SortableTH>
            <SortableTH
              column="wins"
              currentSort={currentSort}
              setSort={setSort}
              className={cn(thClassName, 'justify-center px-1')}
            >
              Wins
            </SortableTH>
            <TH>Skills</TH>
            <TH>Socials</TH>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentUsers.map((user) => (
            <MemberRow key={user.id} user={user} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const MemberRow = ({ user }: { user: LocalProfile }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const skills = user.skills.flatMap((skills: any) => skills.skills);
  return (
    <TableRow
      className="cursor-pointer hover:bg-brand-slate-50"
      onClick={(e) => {
        if (
          e.target === e.currentTarget ||
          e.currentTarget.contains(e.target as Node)
        ) {
          onOpen();
        }
      }}
      role="group"
    >
      <TableCell className="w-[3rem] p-1">
        <p className="max-w-full text-center text-[0.9rem] text-slate-700">
          #{user?.rank}
        </p>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <EarnAvatar className="h-9 w-9" id={user?.id} avatar={user?.photo} />
          <div className="ml-2 hidden md:block">
            <p className="line-clamp-1 w-40 text-sm font-medium text-slate-700 group-hover:underline">
              {`${user?.firstName} ${user?.lastName}`}
            </p>
            <p className="max-w-40 overflow-x-hidden text-ellipsis text-sm font-medium text-slate-500">
              @{user?.username}
            </p>
          </div>
        </div>
        <UserDrawer isOpen={isOpen} onClose={onClose} user={user} />
      </TableCell>
      <TableCell className="px-1">
        <p className="w-[5rem] text-[0.9rem] font-medium text-slate-700">
          $
          {user.totalEarnings.toLocaleString('en-us', {
            maximumFractionDigits: 0,
          })}
        </p>
      </TableCell>
      <TableCell className="p-0">
        <p className="text-center text-[0.9rem] text-slate-700">
          {user?.totalSubmissions}
        </p>
      </TableCell>
      <TableCell className="p-1">
        <p className="text-center text-[0.9rem] text-slate-700">{user?.wins}</p>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-center">
          {skills.slice(0, 2).map((skill: string) => (
            <span
              key={skill}
              className="flex h-5 items-center rounded px-2 text-xs font-medium"
              style={{
                color: skillMap.find((e) => e.mainskill === skill)?.color,
                backgroundColor: `${skillMap.find((e) => e.mainskill === skill)?.color}1A`,
              }}
            >
              {skill}
            </span>
          ))}
          {skills.length > 2 && (
            <Tooltip
              content={
                <div className="flex h-full w-fit flex-wrap gap-2 text-center">
                  {skills.slice(2).map((skill: string) => {
                    const skillColor = skillMap.find(
                      (e) => e.mainskill === skill,
                    )?.color;
                    return (
                      <span
                        key={skill}
                        className="flex h-5 items-center rounded px-2 text-xs font-medium"
                        style={{
                          color: skillColor,
                          backgroundColor: `${skillColor}1A`,
                        }}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>
              }
              contentProps={{ className: 'w-fit max-w-40 px-4 py-2' }}
            >
              <p className="-mt-4 inline-flex h-[19px] items-center rounded bg-[#EFF1F5] px-2 text-xs font-medium text-[#64739C]">
                +{skills.length - 2}
              </p>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex min-w-16 justify-start gap-4">
          <Telegram className="h-[1.2rem] w-[1.2rem]" link={user.telegram} />
          <Twitter className="h-[1.2rem] w-[1.2rem]" link={user.twitter} />
          <Website className="h-[1.2rem] w-[1.2rem]" link={user.website} />
        </div>
      </TableCell>
      <TableCell>
        <Link
          className="inline-flex items-center gap-1 text-[0.9rem] font-medium text-slate-500"
          href={`/t/${user.username}`}
          onClick={(e) => e.stopPropagation()}
          rel="noopener noreferrer"
          target="_blank"
        >
          View Profile <ArrowRight className="h-4 w-4" />
        </Link>
      </TableCell>
    </TableRow>
  );
};
