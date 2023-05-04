import {
  Avatar,
  Box,
  Button,
  Flex,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import toast from 'react-hot-toast';
import { AiFillHeart } from 'react-icons/ai';

import { userStore } from '../../../../store/user';
import { addLike, findSubmission } from '../../../../utils/functions';
import { Comments } from '../comments';

const Chip = ({ icon, label, value }: any) => {
  return (
    <Flex>
      <Box
        alignItems={'center'}
        justifyContent={'center'}
        w={'2rem'}
        h={'2rem'}
        mr={'0.725rem'}
        p={'0.4rem'}
        bg={'#F6EBFF'}
        borderRadius="full"
      >
        <Image w={'100%'} h={'100%'} objectFit="contain" alt="" src={icon} />
      </Box>
      <Box>
        <Text color={'gray.400'} fontSize={'0.5813rem'} fontWeight={'400'}>
          {label}
        </Text>
        <Text fontSize={'0.775rem'} fontWeight={'400'}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
};
export const SubmissionPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const SubmissionInfo = useQuery({
    queryFn: ({ queryKey }) => findSubmission(queryKey[1] as string),
    queryKey: ['submission', router.query.subid],
  });

  const { userInfo } = userStore();
  const likeMutation = useMutation({
    mutationFn: () =>
      addLike(SubmissionInfo.data?.id as string, userInfo?.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries(['submission', router.query.subid]);
      toast.success('Like Added');
    },
  });
  const likes =
    SubmissionInfo.data?.likes !== JSON.stringify([])
      ? JSON.parse(SubmissionInfo.data?.likes ?? '[]')
      : [];
  return (
    <VStack
      align={['center', 'center', 'start', 'start']}
      justify={['center', 'center', 'space-between', 'space-between']}
      flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
      gap={4}
      maxW={'7xl'}
      mt={10}
      mx={'auto'}
    >
      <VStack gap={8} w={['22rem', '22rem', 'full', 'full']} mt={3}>
        <VStack w={'full'} h={'40rem'} bg={'white'} rounded={'md'}>
          <Flex justify={'space-between'} w={'full'} mt={5} px={8}>
            <Text color={'black'} fontSize={'22px'} fontWeight={600}>
              {SubmissionInfo.data?.Talent?.firstname}
              {'  '}
              {SubmissionInfo.data?.Talent?.lastname}’s Submission
            </Text>
            <Button
              zIndex={10}
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
          </Flex>
          <Image
            w={'full'}
            h={'30rem'}
            p={7}
            objectFit={'cover'}
            alt={'submission'}
            rounded={'2rem'}
            src={SubmissionInfo.data?.image}
          />
        </VStack>
        <Comments
          refId={(router.query.subid as string) ?? ''}
          refType="BOUNTY"
        />
      </VStack>
      <Box
        w={'24.4375rem'}
        minH={'21.375rem'}
        px={'1.5625rem'}
        py={'1.125rem'}
        bg={'white'}
        borderRadius={'0.6875rem'}
      >
        <Flex align={'center'}>
          <Avatar
            name="Dan Abrahmov"
            size="lg"
            src={SubmissionInfo.data?.Talent?.avatar as any}
          />
          <Box ml={'21'}>
            <Text fontSize={'1.25rem'} fontWeight={'600'}>
              {SubmissionInfo.data?.Talent?.firstname}
              {SubmissionInfo.data?.Talent?.lastname}
            </Text>
            <Text color={'gray.400'} fontSize={'1rem'} fontWeight={'600'}>
              @{SubmissionInfo.data?.Talent?.username}
            </Text>
          </Box>
        </Flex>
        <Text
          mt={'0.625rem'}
          color={'gray.400'}
          fontSize={'1rem'}
          fontWeight={'400'}
        >
          {SubmissionInfo.data?.Talent?.bio}
        </Text>
        <Flex justify={'space-between'} mt={'2.1875rem'}>
          <Chip
            icon={'/assets/talent/eyes.png'}
            label={'Interested In'}
            value={SubmissionInfo.data?.Talent?.workPrefernce}
          />
          <Chip
            icon={'/assets/talent/cap.png'}
            label={'Works At'}
            value={SubmissionInfo.data?.Talent?.currentEmployer}
          />
        </Flex>
        <Button w={'full'} mt={'1.575rem'} color={'white'} bg={'#6562FF'}>
          Get in touch
        </Button>
        <Flex justify={'space-between'} mt={'32px'}>
          <Box w={'22px'} h={'22px'}>
            <a href={SubmissionInfo.data?.Talent?.twitter}>
              <Image
                w={'100%'}
                h={'100%'}
                objectFit="contain"
                alt=""
                src={'/assets/talent/twitter.png'}
              />
            </a>
          </Box>
          <Box w={'22px'} h={'22px'}>
            <a href={SubmissionInfo.data?.Talent?.linkedin}>
              <Image
                w={'100%'}
                h={'100%'}
                objectFit="contain"
                alt=""
                src={'/assets/talent/linkedIn.png'}
              />
            </a>
          </Box>
          <Box w={'22px'} h={'22px'}>
            <a href={SubmissionInfo.data?.Talent?.github}>
              <Image
                w={'100%'}
                h={'100%'}
                objectFit="contain"
                alt=""
                src={'/assets/talent/github.png'}
              />
            </a>
          </Box>
          <Box w={'22px'} h={'22px'}>
            <a href={SubmissionInfo.data?.Talent?.website}>
              <Image
                w={'100%'}
                h={'100%'}
                objectFit="contain"
                alt=""
                src={'/assets/talent/site.png'}
              />
            </a>
          </Box>
        </Flex>
      </Box>
    </VStack>
  );
};
