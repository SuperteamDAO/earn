import { Flex } from '@chakra-ui/react';
import { useAtomValue } from 'jotai';
import React from 'react';

import { type Listing } from '@/features/listings';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { selectedSubmissionAtom } from '../..';
import { InfoBox } from '../InfoBox';
import { Notes } from './Notes';

interface Props {
  bounty: Listing | undefined;
}

export const Details = ({ bounty }: Props) => {
  const selectedSubmission = useAtomValue(selectedSubmissionAtom);
  const isProject = bounty?.type === 'project';

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
          background: '#cbd5e1',
          borderRadius: '30px',
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
            <InfoBox
              label="Main Submission"
              content={
                selectedSubmission?.link
                  ? getURLSanitized(selectedSubmission?.link)
                  : '-'
              }
            />
            <InfoBox
              label="Tweet Link"
              content={
                selectedSubmission?.tweet
                  ? getURLSanitized(selectedSubmission?.tweet)
                  : '-'
              }
            />
          </>
        )}
        {bounty?.compensationType !== 'fixed' && (
          <InfoBox
            label="Ask"
            content={`${selectedSubmission?.ask?.toLocaleString('en-us')} ${bounty?.token}`}
          />
        )}

        {selectedSubmission?.eligibilityAnswers &&
          selectedSubmission.eligibilityAnswers.map((answer: any) => (
            <InfoBox
              key={answer.question}
              label={answer.question}
              content={answer.answer}
              isHtml
            />
          ))}
        <InfoBox
          label="Anything Else"
          content={selectedSubmission?.otherInfo}
          isHtml
        />
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
