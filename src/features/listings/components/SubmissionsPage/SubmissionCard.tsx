import { ArrowUpIcon } from '@chakra-ui/icons';
import {
  Button,
  HStack,
  Icon,
  Image,
  Link,
  LinkBox,
  LinkOverlay,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import NextLink from 'next/link';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import { LuHeart, LuMessageCircle } from 'react-icons/lu';
import { toast } from 'sonner';

import { ASSET_URL } from '@/constants/ASSET_URL';
import { EarnAvatar } from '@/features/talent';
import { type User } from '@/interface/user';
import { ogImageQuery } from '@/queries/og';
import { useUser } from '@/store/user';
import { getURLSanitized } from '@/utils/getURLSanitized';

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
    <LinkBox
      pos={'relative'}
      overflow={'hidden'}
      w={{ base: 'full', md: 60 }}
      bg={'white'}
      cursor={'pointer'}
      rounded={'md'}
    >
      <HStack justify={'space-between'} w="full" mb={2}>
        <Link as={NextLink} href={`/t/${talent?.username}`}>
          <div className="flex gap-2">
            <EarnAvatar
              size="24px"
              id={talent?.id}
              avatar={talent?.photo || undefined}
            />
            <p className="max-w-[8rem] overflow-hidden text-ellipsis whitespace-nowrap text-base font-medium text-gray-900">
              {talent?.firstName} {talent?.lastName}
            </p>
          </div>
        </Link>
        {winner && (
          <div className="flex-grow pr-1">
            <div className="ml-auto w-fit">
              <Badge position={winnerPosition} />
            </div>
          </div>
        )}
      </HStack>
      <LinkOverlay as={NextLink} w="full" href={`/feed/submission/${id}`}>
        <Image
          w={'full'}
          h={48}
          objectFit={'contain'}
          alt={'card'}
          rounded={'sm'}
          src={ogData?.images?.[0]?.url || ASSET_URL + '/bg/og.svg'}
        />
      </LinkOverlay>
      <HStack align={'center'} gap={4} w={'full'}>
        <Button
          zIndex={10}
          alignItems={'center'}
          gap={2}
          display={'flex'}
          color="gray.500"
          fontWeight={500}
          isLoading={isLoading}
          onClick={handleLike}
          type="button"
          variant={'unstyled'}
        >
          <Icon
            as={LuHeart}
            color={
              !likes?.find((e) => e.id === (user?.id as string))
                ? '#64748b'
                : '#E11D48'
            }
            fill={
              !likes?.find((e) => e.id === (user?.id as string))
                ? '#fff'
                : '#E11D48'
            }
            size={'1.3rem'}
          />
          {likes?.length}
        </Button>
        <LinkOverlay as={NextLink} href={`/feed/submission/${id}`}>
          <LuMessageCircle
            size={'1.23rem'}
            fill={'#CBD5E1'}
            color={'#CBD5E1'}
            style={{
              transform: 'scaleX(-1)',
              marginTop: '2px',
              cursor: 'pointer',
            }}
          />
        </LinkOverlay>
      </HStack>

      <Link as={NextLink} href={getURLSanitized(link)} isExternal>
        <Button
          w="full"
          mt={1}
          py={5}
          color={'gray.400'}
          fontWeight={500}
          borderColor={'gray.300'}
          rightIcon={
            <ArrowUpIcon
              h={5}
              w={5}
              color="gray.400"
              ml={16}
              transform="rotate(45deg)"
            />
          }
          variant="outline"
        >
          <p className="ml-24 text-base">View</p>
        </Button>
      </Link>
    </LinkBox>
  );
};
