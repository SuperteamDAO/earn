import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowUpRight, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { type User } from '@/interface/user';
import { ogImageQuery } from '@/queries/og';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type Rewards } from '../../types';
import { Badge } from './Badge';

interface Props {
  winner: boolean;
  winnerPosition?: keyof Rewards;
  talent: User;
  likes?: {
    id: string;
    date: number;
  }[];
  id: string;
  setUpdate: Dispatch<SetStateAction<boolean>>;
  link: string;
}

export const SubmissionCard = ({
  winnerPosition,
  id,
  winner,
  talent,
  likes,
  setUpdate,
  link,
}: Props) => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data: ogData } = useQuery(ogImageQuery(link));

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsLoading(true);

    const likePromise = axios
      .post('/api/submission/like/', { id })
      .then()
      .finally(() => {
        setIsLoading(false);
        setUpdate((prev: boolean) => !prev);
      });

    toast.promise(likePromise, {
      loading: 'Liking the submission...',
      success: () => {
        const likeAdded = likes?.some((e) => e.id === user?.id)
          ? 'Like removed'
          : 'Liked submission';
        return `${likeAdded}`;
      },
      error: 'Error while liking submission',
    });
  };

  return (
    <div className="relative w-full cursor-pointer overflow-hidden rounded-md bg-white md:w-60">
      <div className="mb-2 flex w-full justify-between gap-2">
        <Link href={`/t/${talent?.username}`}>
          <div className="flex gap-2">
            <EarnAvatar
              className="h-6 w-6"
              id={talent?.id}
              avatar={talent?.photo || undefined}
            />
            <p className="max-w-[8rem] overflow-hidden text-base font-medium text-ellipsis whitespace-nowrap text-gray-900">
              {talent?.firstName} {talent?.lastName}
            </p>
          </div>
        </Link>
        {winner && (
          <div className="grow pr-1">
            <div className="ml-auto w-fit">
              <Badge position={winnerPosition} />
            </div>
          </div>
        )}
      </div>

      <Link href={`/feed/submission/${id}`} className="block w-full">
        <img
          className="h-48 w-full rounded-sm object-contain"
          alt={'card'}
          src={
            ogData === 'error'
              ? ASSET_URL + '/bg/og.svg'
              : ogData?.images?.[0]?.url || ASSET_URL + '/bg/og.svg'
          }
        />
      </Link>

      <div className="flex w-full items-center gap-4">
        <Button
          className={cn(
            'z-10 flex h-auto items-center gap-2 p-0 font-medium',
            'text-slate-500 hover:bg-transparent',
          )}
          variant="ghost"
          disabled={isLoading}
          onClick={handleLike}
          type="button"
        >
          <Heart
            className={cn(
              'h-5 w-5',
              !likes?.find((e) => e.id === user?.id)
                ? 'fill-white text-slate-500'
                : 'fill-rose-600 text-rose-600',
            )}
          />
          <span>{likes?.length}</span>
        </Button>
        <Link href={`/feed/submission/${id}`}>
          <MessageCircle
            size={'1.23rem'}
            fill={'#CBD5E1'}
            color={'#CBD5E1'}
            style={{
              transform: 'scaleX(-1)',
              marginTop: '2px',
              cursor: 'pointer',
            }}
          />
        </Link>
      </div>

      <Link
        href={getURLSanitized(link)}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Button
          variant="outline"
          className="mt-1 w-full border-gray-300 py-5 font-medium text-gray-400"
        >
          <p className="ml-24 text-base">View</p>
          <ArrowUpRight className="ml-16 h-5 w-5 rotate-45 text-gray-400" />
        </Button>
      </Link>
    </div>
  );
};
