import { Box, Button, HStack, Image, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AiFillHeart } from 'react-icons/ai';

import type { Talent } from '../../../../interface/talent';
import { userStore } from '../../../../store/user';
import { addLike } from '../../../../utils/functions';

interface Props {
  image: string;
  winner: boolean;
  talent: Talent;
  likes: string[];
  id: string;
}
export const SubmissionCard = ({ image, id, winner, talent, likes }: Props) => {
  const { userInfo } = userStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const likeMutation = useMutation({
    mutationFn: () => addLike(id, userInfo?.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries(['bounties', router.query.id]);
      toast.success('Like Added');
    },
  });
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
          src={image ?? '/assets/random/submission-card.svg'}
        />
        <HStack align={'center'} justify={'space-between'} w={'full'}>
          <VStack align={'start'}>
            <Text color={'#000000'} fontSize={'1.1rem'} fontWeight={600}>
              {talent?.firstname}
            </Text>
            <HStack>
              <Image
                w={5}
                objectFit={'cover'}
                alt={'profile image'}
                rounded={'full'}
                src={talent.avatar ?? '/assets/randompeople/nft5.svg'}
              />
              <Text color={'gray.400'}>by @{talent.username}</Text>
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
              if (!userInfo?.id) return;
              likeMutation.mutate();
            }}
            variant={'unstyled'}
          >
            <AiFillHeart
              color={
                likes.indexOf(userInfo?.id as string) === -1
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
