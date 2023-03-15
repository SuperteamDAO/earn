import { Flex, Image, Text, VStack } from '@chakra-ui/react';
import moment from 'moment';
import React from 'react';
import { SubmissionType } from '../../../../interface/listings';
import { Talent } from '../../../../interface/talent';
import { SubmissionCard } from './submissionCard';

interface Props {
  submissions: SubmissionType[];
  endTime: string;
}
export const Submission = ({ submissions, endTime }: Props) => {
  return (
    <>
      <VStack
        justify={'center'}
        align={['center', 'center', 'start', 'start']}
        mt={10}
        w={'full'}
      >
        {Number(moment(endTime).format('x')) < Date.now() ? (
          <>
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
          </>
        ) : (
          <>
            <VStack
              h={'25rem'}
              gap={5}
              align={'center'}
              justify={'center'}
              w={'full'}
            >
              <Image src={'/assets/icons/submission.svg'} alt={'submission'} />
              <Text
                color={'gray.800'}
                fontSize={'1.5rem'}
                fontFamily={'Inter'}
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
