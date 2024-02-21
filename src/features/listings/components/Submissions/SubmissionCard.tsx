import {
  Box,
  Button,
  HStack,
  Image,
  Link,
  Text,
  useToast,
} from '@chakra-ui/react';
import type { User } from '@prisma/client';
import axios from 'axios';
import Avatar from 'boring-avatars';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';
import { BiSolidComment } from 'react-icons/bi';
import { IoMdHeart } from 'react-icons/io';
import type { Metadata } from 'unfurl.js/dist/types';

import { userStore } from '@/store/user';
import { Badge } from '@/svg/badge';

import { type Rewards } from '../../types';

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
  const { userInfo } = userStore();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string>('/assets/bg/og.svg');
  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsLoading(true);

    const likePromise = axios
      .post('/api/submission/like/', { submissionId: id })
      .then(async (response) => {
        const wasLiked = response.data.like.find(
          (like: any) => like.id === userInfo?.id,
        );
        if (wasLiked) {
          await axios.post(`/api/email/manual/submissionLike`, { id });
        }
      })
      .finally(() => {
        setIsLoading(false);
        setUpdate((prev: boolean) => !prev);
      });

    toast.promise(likePromise, {
      loading: {
        title: 'Liking the submission...',
        description: 'Please wait',
        variant: 'subtle',
      },
      success: () => {
        const likeAdded = likes?.some((e) => e.id === userInfo?.id)
          ? 'Like removed'
          : 'Liked submission';
        const likeAddedDesc = likes?.some((e) => e.id === userInfo?.id)
          ? "You've removed your like from the submission."
          : "You've liked the submission.";
        return {
          title: likeAdded,
          description: likeAddedDesc,
          status: 'success',
          duration: 2000,
          isClosable: true,
          variant: 'subtle',
        };
      },
      error: {
        title: 'Error while liking submission',
        description: 'Failed to like the submission. Please try again.',
        duration: 2000,
        isClosable: true,
        variant: 'subtle',
      },
    });
  };
  useEffect(() => {
    const fetchImage = async () => {
      if (link) {
        try {
          const { data } = (await axios.post('/api/og', {
            url: link,
          })) as { data: Metadata };
          setImage(data.open_graph.images![0]?.url ?? '/assets/bg/og.svg');
        } catch (error) {
          console.log(error);
          setImage('/assets/bg/og.svg');
        }
      }
    };
    fetchImage();
  }, []);

  return (
    <Box
      as={NextLink}
      pos={'relative'}
      overflow={'hidden'}
      w={{ base: 'full', md: '17.7rem' }}
      p={4}
      bg={'white'}
      cursor={'pointer'}
      href={`${router.asPath.split('?')[0]}/${id}`}
      rounded={'md'}
    >
      {winner && (
        <Box pos="absolute" top="0" right="0">
          <Badge position={winnerPosition} />
        </Box>
      )}
      <Link as={NextLink} href={`/t/${talent?.username}`}>
        <HStack mb={2}>
          {talent?.photo ? (
            <Image
              w={6}
              h={6}
              borderRadius="full"
              objectFit={'cover'}
              alt={`${talent?.firstName} ${talent?.lastName}`}
              rounded={'full'}
              src={talent?.photo || undefined}
            />
          ) : (
            <Avatar
              name={`${talent?.firstName} ${talent?.lastName}`}
              colors={['#92A1C6', '#F0AB3D', '#C271B4']}
              size={24}
              variant="marble"
            />
          )}
          <Text color={'gray.900'} fontSize={'lg'} fontWeight={500}>
            {talent?.firstName} {talent?.lastName}
          </Text>
        </HStack>
      </Link>
      <Image
        w={'full'}
        h={48}
        objectFit={'cover'}
        alt={'card'}
        rounded={'sm'}
        src={image}
      />
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
          <IoMdHeart
            size={'1.3rem'}
            color={
              !likes?.find((e) => e.id === (userInfo?.id as string))
                ? '#CBD5E1'
                : '#FF005C'
            }
          />
          {likes?.length}
        </Button>
        <BiSolidComment
          color={'#CBD5E1'}
          style={{
            transform: 'scaleX(-1)',
            marginTop: '2px',
            cursor: 'pointer',
          }}
        />
      </HStack>

      <Button
        w="full"
        py={4}
        color={'gray.500'}
        fontSize={'md'}
        fontWeight={500}
        borderColor={'gray.300'}
        onClick={(e) => {
          e.stopPropagation();
          router.push(link);
        }}
        variant="outline"
      >
        View
      </Button>
    </Box>
  );
};
