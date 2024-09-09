import { Box, Flex, Link, Text } from '@chakra-ui/react';
import { useAtomValue } from 'jotai';
import NextLink from 'next/link';
import React from 'react';

import { type Listing } from '@/features/listings';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { isLink } from '@/utils/isLink';

import { selectedSubmissionAtom } from '../..';
import { Notes } from './Notes';

interface Props {
  bounty: Listing | undefined;
}

export const Details = ({ bounty }: Props) => {
  const selectedSubmission = useAtomValue(selectedSubmissionAtom);
  const isProject = bounty?.type === 'project';
  const isHackathon = bounty?.type === 'hackathon';

  return (
    <Flex
      overflowY={'scroll'}
      w="full"
      h={'32.6rem'}
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#e2e8f0',
          borderRadius: '24px',
        },
      }}
    >
      <Flex
        direction={'column'}
        flex="1"
        w="full"
        p={4}
        borderColor="brand.slate.200"
        borderRightWidth="1px"
      >
        {!isProject && (
          <>
            <Box mb={4}>
              <Text
                mb={1}
                color="brand.slate.400"
                fontSize="xs"
                fontWeight={600}
                textTransform={'uppercase'}
              >
                Main Submission
              </Text>
              <Link
                as={NextLink}
                color="brand.purple"
                href={getURLSanitized(selectedSubmission?.link || '#')}
                isExternal
              >
                {selectedSubmission?.link
                  ? getURLSanitized(selectedSubmission?.link)
                  : '-'}
              </Link>
            </Box>
            <Box mb={4}>
              <Text
                mb={1}
                color="brand.slate.400"
                fontSize="xs"
                fontWeight={600}
                textTransform={'uppercase'}
              >
                Tweet Link
              </Text>
              <Link
                as={NextLink}
                color="brand.purple"
                href={selectedSubmission?.tweet || '#'}
                isExternal
              >
                {selectedSubmission?.tweet ? selectedSubmission?.tweet : '-'}
              </Link>
            </Box>
          </>
        )}
        {bounty?.compensationType !== 'fixed' && (
          <Box mb={4}>
            <Text
              mb={1}
              color="brand.slate.400"
              fontSize="xs"
              fontWeight={600}
              textTransform={'uppercase'}
            >
              Ask
            </Text>
            <Text color="brand.slate.700">
              {selectedSubmission?.ask?.toLocaleString()} {bounty?.token}
            </Text>
          </Box>
        )}

        {(isProject || isHackathon) &&
          selectedSubmission?.eligibilityAnswers?.map(
            (answer: any, answerIndex: number) => (
              <Box key={answerIndex} mb={4}>
                <Text
                  mb={1}
                  color="brand.slate.400"
                  fontSize="xs"
                  fontWeight={600}
                  textTransform={'uppercase'}
                >
                  {answer.question}
                </Text>
                {isLink(answer.answer) ? (
                  <Link
                    as={NextLink}
                    color="brand.purple"
                    href={getURLSanitized(answer.answer || '#')}
                    isExternal
                  >
                    {answer.answer ? getURLSanitized(answer.answer) : '-'}
                  </Link>
                ) : (
                  <Text color="brand.slate.700">{answer.answer || '-'}</Text>
                )}
              </Box>
            ),
          )}
        <Box mb={4}>
          <Text
            mb={1}
            color="brand.slate.400"
            fontSize="xs"
            fontWeight={600}
            textTransform={'uppercase'}
          >
            Anything Else
          </Text>
          {isLink(selectedSubmission?.otherInfo || '') ? (
            <Link
              as={NextLink}
              color="brand.purple"
              href={getURLSanitized(selectedSubmission?.otherInfo || '#')}
              isExternal
            >
              {selectedSubmission?.otherInfo
                ? getURLSanitized(selectedSubmission?.otherInfo)
                : '-'}
            </Link>
          ) : (
            <Text color="brand.slate.700">
              {selectedSubmission?.otherInfo || '-'}
            </Text>
          )}
        </Box>
      </Flex>
      <Flex w="25%" p={4}>
        {selectedSubmission && (
          <Notes
            key={selectedSubmission.id}
            submissionId={selectedSubmission.id}
            initialNotes={selectedSubmission.notes}
            slug={bounty?.slug}
          />
        )}
      </Flex>
    </Flex>
  );
};
