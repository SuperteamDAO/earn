import {
  Box,
  Button,
  HStack,
  Image,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { User } from '@prisma/client';
import axios from 'axios';
import Avatar from 'boring-avatars';
import { useRouter } from 'next/router';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from 'react';
import { AiFillHeart } from 'react-icons/ai';
import type { Metadata } from 'unfurl.js/dist/types';

import { userStore } from '@/store/user';

interface Props {
  winner: boolean;
  winnerPosition?: string;
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

  const navigateToTalentProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/t/${talent?.username}`);
  };

  return (
    <>
      <VStack
        pos={'relative'}
        overflow={'hidden'}
        w={{ base: 'full', md: '18rem' }}
        h={'18rem'}
        p={5}
        bg={'white'}
        cursor={'pointer'}
        onClick={() => {
          router.push(`${router.asPath.split('?')[0]}/${id}`);
        }}
        rounded={'lg'}
      >
        <Image
          w={'full'}
          h={'full'}
          maxH={44}
          objectFit={'cover'}
          alt={'card'}
          src={image}
        />
        <HStack align={'center'} justify={'space-between'} w={'full'}>
          <VStack align={'start'}>
            <Text
              color={'#000000'}
              fontSize={'1.1rem'}
              fontWeight={600}
              onClick={navigateToTalentProfile}
            >
              {talent?.firstName}
            </Text>
            <HStack>
              {talent?.photo ? (
                <Image
                  w={5}
                  h={5}
                  borderRadius="full"
                  alt={`${talent?.firstName} ${talent?.lastName}`}
                  rounded={'full'}
                  src={talent?.photo || undefined}
                />
              ) : (
                <Avatar
                  name={`${talent?.firstName} ${talent?.lastName}`}
                  colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                  size={20}
                  variant="marble"
                />
              )}
              <Text color={'gray.400'}>
                by @
                {talent?.username && talent?.username?.length < 12
                  ? talent?.username
                  : `${talent?.username?.slice(0, 12)}...`}
              </Text>
            </HStack>
          </VStack>
          <Button
            pos={'absolute'}
            zIndex={10}
            right={5}
            alignItems={'center'}
            gap={2}
            display={'flex'}
            w={14}
            border={'1px solid #CBD5E1'}
            isLoading={isLoading}
            onClick={handleLike}
            type="button"
            variant={'unstyled'}
          >
            <AiFillHeart
              color={
                !likes?.find((e) => e.id === (userInfo?.id as string))
                  ? '#94A3B8'
                  : '#FF005C'
              }
            />
            {likes?.length}
          </Button>
        </HStack>
        <Box
          pos={'absolute'}
          zIndex={3}
          top={0}
          justifyContent={'center'}
          display={winner ? 'flex' : 'none'}
          overflowX={'hidden'}
          w={'15rem'}
          h={'2rem'}
          bg={'#FFE6B6'}
          transform={'rotate(45deg) translate(4.5rem) translateY(-2rem)'}
        >
          <Text
            ml={5}
            color={'#D26F12'}
            fontWeight={600}
            lineHeight={8}
            textTransform={'uppercase'}
          >
            🏆 {winnerPosition}
          </Text>
        </Box>
      </VStack>
    </>
  );
};
