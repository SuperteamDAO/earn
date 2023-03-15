import {
  Box,
  Button,
  Flex,
  Image,
  Text,
  VStack,
  Avatar,
  useDisclosure,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import toast from 'react-hot-toast';
import { AiFillHeart } from 'react-icons/ai';
import { Talent } from '../../../../interface/talent';
import { userStore } from '../../../../store/user';
import { addLike, findSubmission } from '../../../../utils/functions';
import { CreateProfileModal } from '../../../modals/createProfile';
import TalentBio from '../../../TalentBio';
import { Comments } from '../comments';

let Chip = ({ icon, label, value }: any) => {
  return (
    <Flex>
      <Box
        w={'2rem'}
        h={'2rem'}
        bg={'#F6EBFF'}
        borderRadius="full"
        mr={'0.725rem'}
        justifyContent={'center'}
        alignItems={'center'}
        p={'0.4rem'}
      >
        <Image
          objectFit="contain"
          width={'100%'}
          height={'100%'}
          alt=""
          src={icon}
        />
      </Box>
      <Box>
        <Text fontWeight={'400'} fontSize={'0.5813rem'} color={'gray.400'}>
          {label}
        </Text>
        <Text fontWeight={'400'} fontSize={'0.775rem'}>
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
  const { isOpen, onClose, onOpen } = useDisclosure();
  const likeMutation = useMutation({
    mutationFn: () =>
      addLike(SubmissionInfo.data?.id as string, userInfo?.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries(['submission', router.query.subid]);
      toast.success('Like Added');
    },
  });
  let likes =
    SubmissionInfo.data?.likes !== JSON.stringify([])
      ? JSON.parse(SubmissionInfo.data?.likes ?? '[]')
      : [];
  return (
    <>
      {isOpen && <CreateProfileModal isOpen={isOpen} onClose={onClose} />}

      <VStack
        maxW={'7xl'}
        mx={'auto'}
        align={['center', 'center', 'start', 'start']}
        gap={4}
        flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
        justify={['center', 'center', 'space-between', 'space-between']}
        mt={10}
      >
        <VStack gap={8} w={['22rem', '22rem', 'full', 'full']} mt={3}>
          <VStack rounded={'md'} w={'full'} h={'40rem'} bg={'white'}>
            <Flex w={'full'} justify={'space-between'} mt={5} px={8}>
              <Text color={'black'} fontSize={'22px'} fontWeight={600}>
                {SubmissionInfo.data?.Talent?.firstname}
                {'  '}
                {SubmissionInfo.data?.Talent?.lastname}’s Submission
              </Text>
              <Button
                variant={'unstyled'}
                border={'1px solid #CBD5E1'}
                w={14}
                display={'flex'}
                alignItems={'center'}
                gap={2}
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
            </Flex>
            <Image
              src={SubmissionInfo.data?.image}
              w={'full'}
              h={'30rem'}
              p={7}
              rounded={'2rem'}
              alt={'submission'}
              objectFit={'cover'}
            />
          </VStack>
          <Comments
            refId={(router.query.subid as string) ?? ''}
            onOpen={onOpen}
          />
        </VStack>
        <Box
          px={'1.5625rem'}
          py={'1.125rem'}
          borderRadius={'0.6875rem'}
          bg={'white'}
          w={'24.4375rem'}
          minH={'21.375rem'}
        >
          <Flex align={'center'}>
            <Avatar
              name="Dan Abrahmov"
              src={SubmissionInfo.data?.Talent?.avatar as any}
              size="lg"
            />
            <Box ml={'21'}>
              <Text fontWeight={'600'} fontSize={'1.25rem'}>
                {SubmissionInfo.data?.Talent?.firstname}
                {SubmissionInfo.data?.Talent?.lastname}
              </Text>
              <Text fontWeight={'600'} fontSize={'1rem'} color={'gray.400'}>
                @{SubmissionInfo.data?.Talent?.username}
              </Text>
            </Box>
          </Flex>
          <Text
            mt={'0.625rem'}
            fontWeight={'400'}
            fontSize={'1rem'}
            color={'gray.400'}
          >
            {SubmissionInfo.data?.Talent?.bio}
          </Text>
          <Flex justifyContent={'space-between'} mt={'2.1875rem'}>
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
          <Button color={'white'} bg={'#6562FF'} w={'full'} mt={'1.575rem'}>
            Get in touch
          </Button>
          <Flex mt={'32px'} justifyContent={'space-between'}>
            <Box w={'22px'} h={'22px'}>
              <a href={SubmissionInfo.data?.Talent?.twitter}>
                <Image
                  objectFit="contain"
                  width={'100%'}
                  height={'100%'}
                  alt=""
                  src={'/assets/talent/twitter.png'}
                />
              </a>
            </Box>
            <Box w={'22px'} h={'22px'}>
              <a href={SubmissionInfo.data?.Talent?.linkedin}>
                <Image
                  objectFit="contain"
                  width={'100%'}
                  height={'100%'}
                  alt=""
                  src={'/assets/talent/linkedIn.png'}
                />
              </a>
            </Box>
            <Box w={'22px'} h={'22px'}>
              <a href={SubmissionInfo.data?.Talent?.github}>
                <Image
                  objectFit="contain"
                  width={'100%'}
                  height={'100%'}
                  alt=""
                  src={'/assets/talent/github.png'}
                />
              </a>
            </Box>
            <Box w={'22px'} h={'22px'}>
              <a href={SubmissionInfo.data?.Talent?.website}>
                <Image
                  objectFit="contain"
                  width={'100%'}
                  height={'100%'}
                  alt=""
                  src={'/assets/talent/site.png'}
                />
              </a>
            </Box>
          </Flex>
        </Box>
      </VStack>
    </>
  );
};
