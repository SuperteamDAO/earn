import { Flex, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { SubmissionCard } from './submissionCard';

export const Submission = () => {
  return (
    <>
      <VStack
        justify={'center'}
        align={['center', 'center', 'start', 'start']}
        mt={10}
      >
        <Flex gap={3} ml={5}>
          <Text fontWeight={600} fontSize={'1.2rem'} color={'#1E293B'}>
            44
          </Text>
          <Text fontWeight={600} fontSize={'1.2rem'} color={'#94A3B8'}>
            Submissions
          </Text>
        </Flex>
        <Flex
          flexWrap={'wrap'}
          gap={10}
          justify={['center', 'center', 'start', 'start']}
          mt={10}
        >
          <SubmissionCard />
          <SubmissionCard />
          <SubmissionCard />
          <SubmissionCard />
          <SubmissionCard />
          <SubmissionCard />
          <SubmissionCard />
          <SubmissionCard />
        </Flex>
      </VStack>
    </>
  );
};
