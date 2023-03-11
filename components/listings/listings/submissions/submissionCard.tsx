import { Box, Button, HStack, Image, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AiFillHeart } from 'react-icons/ai';
import { Talent } from '../../../../interface/talent';
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
        overflow={'hidden'}
        h={'18rem'}
        rounded={'lg'}
        p={5}
        position={'relative'}
        w={'18rem'}
        bg={'white'}
        onClick={() => {
          router.push(router.asPath.split('?')[0] + `/submission/${id}`);
        }}
      >
        <Image
          src={image ?? '/assets/random/submission-card.svg'}
          w={'full'}
          h={'21rem'}
          objectFit={'cover'}
          alt={'card'}
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
                rounded={'full'}
                src={talent.avatar ?? '/assets/randompeople/nft5.svg'}
                alt={'profile image'}
              />
              <Text color={'gray.400'}>by @{talent.username}</Text>
            </HStack>
          </VStack>
          <Button
            variant={'unstyled'}
            border={'1px solid #CBD5E1'}
            w={14}
            display={'flex'}
            alignItems={'center'}
            gap={2}
            right={5}
            position={'absolute'}
            zIndex={10}
            onClick={() => {
              if (!userInfo?.id) return;
              likeMutation.mutate();
            }}
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
          bg={'#FFE6B6'}
          transform={'rotate(45deg) translate(4.5rem) translateY(-2rem)'}
          w={'15rem'}
          h={'2rem'}
          zIndex={3}
          top={0}
          overflowX={'hidden'}
          position={'absolute'}
          display={winner ? 'flex' : 'none'}
          justifyContent={'center'}
        >
          <Text
            letterSpacing={'0.195rem'}
            color={'#D26F12'}
            fontWeight={600}
            lineHeight={8}
            ml={5}
          >
            WINNER
          </Text>
        </Box>
      </VStack>
    </>
  );
};
