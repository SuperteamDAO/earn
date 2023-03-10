import { Flex, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { SubmissionType } from '../../../../interface/listings';
import { Talent } from '../../../../interface/talent';
import { SubmissionCard } from './submissionCard';

interface Props {
  submissions: SubmissionType[];
}
export const Submission = ({ submissions }: Props) => {
  return (
    <>
      <VStack
        justify={'center'}
        align={['center', 'center', 'start', 'start']}
        mt={10}
      >
        <Flex gap={3} ml={5}>
          <Text fontWeight={600} fontSize={'1.2rem'} color={'#1E293B'}>
            {submissions.length}
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
          {submissions?.map((el) => {
            const likes = JSON.parse(el.likes);
            return (
              <SubmissionCard
                id={el.id}
                likes={likes}
                talent={el.Talent as Talent}
                key={el.id}
                winner={false}
                image={el.image}
              />
            );
          })}
        </Flex>
      </VStack>
    </>
  );
};
