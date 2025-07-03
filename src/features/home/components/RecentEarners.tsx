import Link from 'next/link';
import posthog from 'posthog-js';
import React, { useEffect, useRef, useState } from 'react';

import MdArrowForward from '@/components/icons/MdArrowForward';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { tokenList } from '@/constants/tokenList';
import { type User } from '@/interface/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURL } from '@/utils/validUrl';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

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

  return (
    <Link href={`${getURL()}t/${username}`} className="block" prefetch={false}>
      <div className="my-4 flex w-full items-center">
        <div className="mr-3 flex items-center justify-center">
          <EarnAvatar id={id} avatar={avatar} />
        </div>
        <div className="w-[13.8rem]">
          <p className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-black">
            {name}
          </p>
          <p className="overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap text-gray-400">
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
          <span className="text-sm font-medium text-gray-400">{token}</span>
        </div>
      </div>
    </Link>
  );
};

export const RecentEarners = ({ earners }: { earners?: User[] }) => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const multipliedEarners = earners ? [...earners, ...earners, ...earners] : [];

  const animate = () => {
    const marquee = marqueeRef.current;
    if (marquee && !isPaused) {
      if (marquee.scrollHeight - marquee.scrollTop <= marquee.clientHeight) {
        marquee.scrollTop -= marquee.scrollHeight / 3;
      } else {
        marquee.scrollTop += 1;
      }
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">
          RECENT EARNERS
        </span>
        <Link
          href="/leaderboard"
          className="ph-no-capture text-brand-purple flex items-center text-xs font-medium"
          onClick={() => {
            posthog.capture('view leaderboard_homepage');
          }}
        >
          Leaderboard
          <MdArrowForward className="ml-1" />
        </Link>
      </div>
      <div className="relative flex flex-col">
        <div
          ref={marqueeRef}
          className="h-[300px] overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white"
        />
      </div>
    </div>
  );
};
