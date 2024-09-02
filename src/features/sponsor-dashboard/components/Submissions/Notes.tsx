import { Flex, HStack, Spinner, Text, Textarea } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useState } from 'react';

import { type SubmissionWithUser } from '@/interface/submission';

import { selectedSubmissionAtom } from '../..';

const MAX_CHARACTERS = 500;

type Props = {
  submissionId: string;
  initialNotes?: string;
  slug: string | undefined;
};

export const Notes = ({ submissionId, initialNotes = '', slug }: Props) => {
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );
  const [notes, setNotes] = useState(initialNotes || '');
  const queryClient = useQueryClient();

  const { mutate: updateNotes, isPending: isSaving } = useMutation({
    mutationFn: (content: string) =>
      axios.post('/api/sponsor-dashboard/submission/update-notes', {
        id: submissionId,
        notes: content,
      }),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<SubmissionWithUser[]>(
        ['sponsor-submissions', slug],
        (old) =>
          old?.map((submission) =>
            submission.id === submissionId
              ? { ...submission, notes: variables }
              : submission,
          ),
      );
    },
    onError: (error) => {
      console.error('Error saving notes:', error);
    },
  });

  const debouncedUpdateNotes = useCallback(
    debounce((content: string) => updateNotes(content), 1000),
    [submissionId, updateNotes],
  );

  useEffect(() => {
    debouncedUpdateNotes(notes);
    return () => {
      debouncedUpdateNotes.cancel();
    };
  }, [notes, debouncedUpdateNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (value !== '' && notes === '') {
      value = '• ' + value;
    }
    if (value.length <= MAX_CHARACTERS) {
      if (selectedSubmission) {
        setSelectedSubmission({
          ...selectedSubmission,
          notes: value,
        });
      }
      setNotes(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cursorPosition = e.currentTarget.selectionStart;
      const textBeforeCursor = notes.slice(0, cursorPosition);
      const textAfterCursor = notes.slice(cursorPosition);
      setNotes(`${textBeforeCursor}\n• ${textAfterCursor}`);
    } else if (e.key === 'Backspace') {
      const lines = notes.split('\n');
      if (lines[lines.length - 1] === '• ' && lines.length > 1) {
        e.preventDefault();
        setNotes(notes.slice(0, -3));
      }
    }
  };

  return (
    <Flex align="start" direction="column" w="full">
      <HStack justify="space-between" w="full" mb={2} color="brand.slate.400">
        <Text fontWeight={800}>Review Notes</Text>
        {isSaving ? (
          <Spinner size="xs" />
        ) : (
          <Text fontSize="xx-small">Auto-saved</Text>
        )}
      </HStack>
      <Textarea
        key={submissionId}
        sx={{
          lineHeight: '2',
          '& ::placeholder': {
            lineHeight: '2',
          },
        }}
        p={2}
        color="brand.slate.400"
        fontSize={'sm'}
        border="none"
        _placeholder={{ color: 'brand.slate.400' }}
        whiteSpace="pre-wrap"
        resize="vertical"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="• Start typing notes here"
        rows={20}
        value={notes}
      />
      <Text mt={1} color="brand.slate.400" fontSize="xs">
        {MAX_CHARACTERS - notes.length} characters remaining
      </Text>
    </Flex>
  );
};
