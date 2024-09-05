import { ArrowUpIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  HStack,
  Icon,
  Image,
  Link,
  LinkBox,
  LinkOverlay,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import { LuHeart, LuMessageCircle } from 'react-icons/lu';
import { toast } from 'sonner';

import { EarnAvatar } from '@/features/talent';
import { type User } from '@/interface/user';
import { ogImageQuery } from '@/queries/og-image';
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data: image } = useQuery(ogImageQuery(link));
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
          <HStack>
            <EarnAvatar
              size="24px"
              id={talent?.id}
              avatar={talent?.photo || undefined}
            />
            <Text
              overflow={'hidden'}
              maxW="8rem"
              color={'gray.900'}
              fontSize={'md'}
              fontWeight={500}
              whiteSpace={'nowrap'}
              textOverflow={'ellipsis'}
            >
              {talent?.firstName} {talent?.lastName}
            </Text>
          </HStack>
        </Link>
        {winner && (
          <Box flexGrow={1} pr={1}>
            <Box w="fit-content" ml="auto">
              <Badge position={winnerPosition} />
            </Box>
          </Box>
        )}
      </HStack>
      <LinkOverlay as={NextLink} w="full" href={`${router.asPath}/${id}`}>
        <Image
          w={'full'}
          h={48}
          objectFit={'contain'}
          alt={'card'}
          rounded={'sm'}
          src={image || '/assets/bg/og.svg'}
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
        <LinkOverlay as={NextLink} href={`${router.asPath}/${id}`}>
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
          onClick={(e) => {
            e.stopPropagation();
            router.push(link);
          }}
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
          <Text ml={24} fontSize={'17px'}>
            View
          </Text>
        </Button>
      </Link>
    </LinkBox>
  );
};
