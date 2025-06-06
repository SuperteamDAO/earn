import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { type User } from '@/interface/user';
import { ogImageQuery } from '@/queries/og';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { colorMap } from '@/features/sponsor-dashboard/utils/statusColorMap';
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
  status?: keyof typeof colorMap;
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
  status,
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
    <>
      <div className="relative w-full cursor-pointer overflow-hidden rounded-md bg-white md:w-60">
        <div className="mb-2 flex w-full justify-between gap-2">
          <Link
            href={`/t/${talent?.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-2">
              <EarnAvatar
                className="h-6 w-6"
                id={talent?.id}
                avatar={talent?.photo || undefined}
              />
              <p className="max-w-[8rem] overflow-hidden text-ellipsis whitespace-nowrap text-base font-medium text-gray-900">
                {talent?.name}
              </p>
            </div>
          </Link>
          {status && (
            <div className="flex-grow pr-1">
              <span
                className={cn(
                  'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-center text-[10px] capitalize',
                  colorMap[status as keyof typeof colorMap].bg,
                  colorMap[status as keyof typeof colorMap].color,
                )}
              >
                {status}
              </span>
            </div>
          )}
          {winner && !status && (
            <div className="flex-grow pr-1">
              <div className="ml-auto w-fit">
                <Badge position={winnerPosition} />
              </div>
            </div>
          )}
        </div>

        <div className="block w-full">
          <img
            className="h-48 w-full rounded-sm object-contain"
            alt={'card'}
            src={
              ogData === 'error'
                ? ASSET_URL + '/bg/og.svg'
                : ogData?.images?.[0]?.url || ASSET_URL + '/bg/og.svg'
            }
          />
        </div>

        <div className="flex w-full items-center gap-4">
          <Button
            className={cn(
              'z-10 flex h-auto items-center gap-2 p-0 font-medium',
              'text-slate-500 hover:bg-transparent',
            )}
            variant="ghost"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleLike(e);
            }}
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
            {likes?.length}
          </Button>
          <Link
            href={`/feed/submission/${id}`}
            onClick={(e) => e.stopPropagation()}
          >
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
      </div>
    </>
  );
};
