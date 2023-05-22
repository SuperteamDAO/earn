import { Box, Button, HStack, Image, Text, VStack } from '@chakra-ui/react';
import type { User } from '@prisma/client';
import axios from 'axios';
import { useRouter } from 'next/router';
import type { Dispatch, SetStateAction } from 'react';
import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { AiFillHeart } from 'react-icons/ai';
import type { Metadata } from 'unfurl.js/dist/types';

import { userStore } from '../../../../store/user';

interface Props {
  winner: boolean;
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
  id,
  winner,
  talent,
  likes,
  setUpdate,
  link,
}: Props) => {
  const { userInfo } = userStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string>('/assets/bg/og.svg');
  const handleLike = async () => {
    try {
      setIsLoading(true);
      await axios.post('/api/submission/like', {
        submissionId: id,
        userId: userInfo?.id,
      });
      if (likes?.find((e) => e.id === (userInfo?.id as string))) {
        toast.success('Liked removed from submission');
      } else {
        toast.success('Liked submission');
      }
      setIsLoading(false);
      setUpdate((prev: boolean) => !prev);
    } catch (error) {
      setIsLoading(false);
      console.log(error);

      toast.error('Error while liking submission');
    }
  };
  useEffect(() => {
    const fetchImage = async () => {
      if (link) {
        const { data } = (await axios.post('/api/og', {
          url: link,
        })) as { data: Metadata };
        console.log(data.open_graph.images![0]?.url);
        setImage(data.open_graph.images![0]?.url ?? '/assets/bg/og.svg');
      }
    };
    fetchImage();
  }, []);
  return (
    <>
      <VStack
        pos={'relative'}
        overflow={'hidden'}
        w={'18rem'}
        h={'18rem'}
        p={5}
        bg={'white'}
        onClick={() => {
          router.push(`${router.asPath.split('?')[0]}/${id}`);
        }}
        rounded={'lg'}
      >
        <Image w={'full'} h={80} objectFit={'cover'} alt={'card'} src={image} />
        <HStack align={'center'} justify={'space-between'} w={'full'}>
          <VStack align={'start'}>
            <Text color={'#000000'} fontSize={'1.1rem'} fontWeight={600}>
              {talent?.firstName}
            </Text>
            <HStack>
              <Image
                w={5}
                h={5}
                objectFit={'cover'}
                alt={'profile'}
                rounded={'full'}
                src={
                  talent.photo ? talent.photo : '/assets/randompeople/nft4.png'
                }
              />
              <Text color={'gray.400'}>
                by @
                {talent.username.length < 12
                  ? talent.username
                  : `${talent.username.slice(0, 12)}...`}
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
            onClick={() => {
              if (!userInfo?.id) return;
              handleLike();
            }}
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
          <Toaster />
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
            letterSpacing={'0.195rem'}
          >
            WINNER
          </Text>
        </Box>
      </VStack>
    </>
  );
};
