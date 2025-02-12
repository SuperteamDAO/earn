import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Loader2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { isNotesUpdatingAtom, selectedSubmissionAtom } from '../../atoms';

const MAX_CHARACTERS = 1000;

type Props = {
  submissionId: string;
  initialNotes?: string;
  slug: string | undefined;
};

export const Notes = ({ submissionId, initialNotes = '', slug }: Props) => {
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );
  const setNotesUpdating = useSetAtom(isNotesUpdatingAtom);
  const [notes, setNotes] = useState(initialNotes || '');
  const queryClient = useQueryClient();

  const { mutate: updateNotes, isPending: isSaving } = useMutation({
    mutationFn: (content: string) =>
      api.post('/api/sponsor-dashboard/submission/update-notes', {
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
    onSettled: () => {
      setNotesUpdating(false);
    },
  });

  const debouncedUpdateNotes = useCallback(
    debounce((content: string) => updateNotes(content), 1000),
    [submissionId, updateNotes],
  );

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
      debouncedUpdateNotes(value);
      setNotesUpdating(true);
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
    <div className="flex w-full flex-col items-start">
      <div className="mb-2 flex w-full items-center justify-between text-slate-400">
        <span className="font-extrabold">Review Notes</span>
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className="text-[10px]">Auto-saved</span>
        )}
      </div>
      <Textarea
        className="whitespace-pre-wrap border-none text-sm text-slate-600 placeholder:text-slate-400"
        key={submissionId}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="• Start typing notes here"
        rows={20}
        value={notes}
      />
      <p className="mt-1 text-xs text-slate-400">
        {MAX_CHARACTERS - notes.length} characters remaining
      </p>
    </div>
  );
};
