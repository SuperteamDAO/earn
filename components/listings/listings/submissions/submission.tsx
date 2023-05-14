import { Flex, Image, Text, VStack } from '@chakra-ui/react';
import moment from 'moment';
import React from 'react';

import type { SubmissionWithUser } from '@/interface/submission';

import { SubmissionCard } from './submissionCard';

interface Props {
  submissions: SubmissionWithUser[];
  endTime: string;
}
export const Submissions = ({ submissions, endTime }: Props) => {
  return (
    <>
      <VStack
        align={['center', 'center', 'start', 'start']}
        justify={'center'}
        w={'full'}
        mt={10}
      >
        {Number(moment(endTime).format('x')) > Date.now() ? (
          <>
            <VStack align={'start'} w={'full'} maxW={'7xl'} mx="auto">
              <Flex gap={3} ml={5}>
                <Text color={'#1E293B'} fontSize={'1.2rem'} fontWeight={600}>
                  {submissions.length}
                </Text>
                <Text color={'#94A3B8'} fontSize={'1.2rem'} fontWeight={600}>
                  Submissions
                </Text>
              </Flex>
              <Flex
                justify={['center', 'center', 'start', 'start']}
                wrap={'wrap'}
                gap={10}
                mt={10}
              >
                {submissions?.map((el) => {
                  return (
                    <SubmissionCard
                      id={el.id}
                      likes={[]}
                      talent={el.user}
                      key={el.id}
                      winner={false}
                      image={''}
                    />
                  );
                })}
              </Flex>
            </VStack>
          </>
        ) : (
          <>
            <VStack
              align={'center'}
              justify={'center'}
              gap={5}
              w={'full'}
              h={'25rem'}
            >
              <Image alt={'submission'} src={'/assets/icons/submission.svg'} />
              <Text
                color={'gray.800'}
                fontFamily={'Inter'}
                fontSize={'1.5rem'}
                fontWeight={600}
              >
                Submissions are not public
              </Text>
            </VStack>
          </>
        )}
      </VStack>
    </>
  );
};
