import { Image, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import React, { type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import type { SubmissionWithUser } from '@/interface/submission';
import { dayjs } from '@/utils/dayjs';

import { type Listing } from '../../types';
import { SubmissionCard } from './SubmissionCard';

interface Props {
  bounty: Listing;
  submissions: SubmissionWithUser[];
  endTime: string;
  setUpdate: Dispatch<SetStateAction<boolean>>;
}
export const SubmissionList = ({
  bounty,
  submissions,
  endTime,
  setUpdate,
}: Props) => {
  const { t } = useTranslation('common');

  return (
    <>
      <VStack
        align={['center', 'center', 'start', 'start']}
        justify={'start'}
        w={'full'}
        minH={'100vh'}
        mt={10}
      >
        {dayjs(endTime).valueOf() < Date.now() ? (
          <>
            <VStack align={'start'} w={'full'} maxW={'7xl'} mx="auto">
              <SimpleGrid
                w="full"
                px={{ base: 3, md: 6 }}
                columns={{ base: 1, md: 2, lg: 2, xl: 3 }}
                spacing={{ base: 5, md: 20 }}
              >
                {submissions?.map((submission) => {
                  return (
                    <SubmissionCard
                      id={submission.id}
                      likes={
                        (submission.like as unknown as {
                          id: string;
                          date: number;
                        }[]) ?? []
                      }
                      talent={submission.user}
                      key={submission.id}
                      winner={
                        !!bounty?.isWinnersAnnounced && !!submission.isWinner
                      }
                      link={submission.link ?? ''}
                      setUpdate={setUpdate}
                      winnerPosition={submission.winnerPosition}
                    />
                  );
                })}
              </SimpleGrid>
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
              <Image
                alt={t('submissionList.submissionIconAlt')}
                src={'/assets/icons/submission.svg'}
              />
              <Text
                color={'gray.800'}
                fontFamily={'var(--font-sans)'}
                fontSize={'1.5rem'}
                fontWeight={600}
                textAlign="center"
              >
                {t('submissionList.submissionsNotPublic')}
                <br />
                {t('submissionList.checkBackSoon')}
              </Text>
            </VStack>
          </>
        )}
      </VStack>
    </>
  );
};
