import { Flex, Image, Text, VStack } from '@chakra-ui/react';
import type { User } from '@prisma/client';
import { useRouter } from 'next/router';
import React from 'react';

import TalentBio from '@/components/TalentBio';

import { Comments } from '../comments';

interface Props {
  user: User;
}
export const SubmissionPage = ({ user }: Props) => {
  const router = useRouter();

  return (
    <VStack
      align={['center', 'center', 'start', 'start']}
      justify={['center', 'center', 'space-between', 'space-between']}
      flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
      gap={4}
      w="full"
      maxW={'7xl'}
      mx={'auto'}
    >
      <VStack gap={8} w={'full'} mt={3}>
        <VStack w={'full'} h={'40rem'} bg={'white'} rounded={'md'}>
          <Flex justify={'space-between'} w={'full'} mt={5} px={8}>
            <Text color={'black'} fontSize={'22px'} fontWeight={600}>
              {user?.firstName}
              {user?.firstName}’s Submission
            </Text>
            {/* <Button
              zIndex={10}
              alignItems={'center'}
              gap={2}
              display={'flex'}
              w={14}
              border={'1px solid #CBD5E1'}
              variant={'unstyled'}
            >
              <AiFillHeart />
              {likes?.length}
            </Button> */}
          </Flex>
          <Image
            w={'full'}
            h={'30rem'}
            p={7}
            objectFit={'cover'}
            alt={'submission'}
            rounded={'2rem'}
            src={'/assets/bg/og.svg'}
          />
        </VStack>
        <Comments
          refId={(router.query.subid as string) ?? ''}
          refType="BOUNTY"
        />
      </VStack>
      <VStack w={['100%', '100%', '36rem', '36rem']}>
        <TalentBio successPage={false} user={user} />
      </VStack>
    </VStack>
  );
};
