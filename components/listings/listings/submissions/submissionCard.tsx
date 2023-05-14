import { Box, Button, HStack, Image, Text, VStack } from '@chakra-ui/react';
import type { User } from '@prisma/client';
import { useRouter } from 'next/router';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AiFillHeart } from 'react-icons/ai';

import { userStore } from '../../../../store/user';

interface Props {
  image: string;
  winner: boolean;
  talent: User;
  likes?: string[];
  id: string;
}
export const SubmissionCard = ({ id, winner, talent, likes }: Props) => {
  const { userInfo } = userStore();
  const router = useRouter();
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
        <Image
          w={'full'}
          h={80}
          objectFit={'cover'}
          alt={'card'}
          src={'/assets/bg/og.svg'}
        />
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
            onClick={() => {
              // if (!userInfo?.id) return;
            }}
            variant={'unstyled'}
          >
            <AiFillHeart
              color={
                likes?.indexOf(userInfo?.id as string) === -1
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
