import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import React from 'react';
import { MdArrowForward } from 'react-icons/md';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { HIDE_LEADERBOARD } from '@/constants/project';
import { tokenList } from '@/constants/tokenList';
import { type User } from '@/interface/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURL } from '@/utils/validUrl';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import styles from './RecentEarners.module.css';

interface EarnerProps {
  name: string;
  avatar?: string;
  amount: number;
  bounty?: string;
  token?: string;
  username: string;
  id: string;
}

const Earner = ({
  amount,
  name,
  avatar,
  bounty,
  token,
  username,
  id,
}: EarnerProps) => {
  const tokenObj = tokenList.find((t) => t.tokenSymbol === token);
  const tokenIcon = tokenObj
    ? tokenObj.icon
    : ASSET_URL + '/landingsponsor/icons/usdc.svg';
  const isUSDbased = token === 'Any';

  return (
    <Link href={`${getURL()}t/${username}`} className="block">
      <div className="my-2 flex w-full items-center">
        <div className="mr-3 flex items-center justify-center">
          <EarnAvatar id={id} avatar={avatar} />
        </div>
        <div className="w-[13.8rem]">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-black">
            {name}
          </p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-gray-400">
            {bounty}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <img
            className="h-5 w-5 rounded-full"
            alt={`${token} icon`}
            src={tokenIcon}
          />
          <span className="text-sm font-medium text-gray-600">
            {formatNumberWithSuffix(amount)}
          </span>
          <span className="text-sm font-medium text-gray-400">
            {isUSDbased ? 'USD' : token}
          </span>
        </div>
      </div>
    </Link>
  );
};

export const RecentEarners = ({ earners }: { earners?: User[] }) => {
  const posthog = usePostHog();

  const multipliedEarners = earners ? [...earners, ...earners, ...earners] : [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">
          RECENT CONTRIBUTORS
        </span>
        <Link
          href="/leaderboard"
          className={cn(
            'ph-no-capture flex items-center text-xs font-semibold text-brand-green',
            HIDE_LEADERBOARD && 'hidden',
          )}
          onClick={() => {
            posthog.capture('view leaderboard_homepage');
          }}
        >
          Leaderboard
          <MdArrowForward className="ml-1" />
        </Link>
      </div>
      <div className={styles.marqueeContainer}>
        <div className={styles.marquee}>
          {multipliedEarners.map((t: any, index: number) => (
            <Earner
              key={`${t.id}-${index}`}
              amount={t.reward ?? 0}
              token={t.rewardToken}
              name={`${t.firstName} ${t.lastName}`}
              username={t.username}
              avatar={t.photo}
              bounty={t.title ?? ''}
              id={t.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
