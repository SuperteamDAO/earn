import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Info, Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { Tooltip } from '@/components/ui/tooltip';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { selectedSubmissionAtom } from '../../atoms';

const MAX_CHARACTERS = 2000;

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
    <div className="flex w-full flex-col items-start">
      <div className="mb-4 flex w-full items-center justify-between text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Internal Notes</span>
          <Tooltip content="Only visible to your sponsor team. Use this space to leave internal feedback, evaluation notes, or reminders.">
            <Info className="size-4 text-slate-300 hover:text-slate-400" />
          </Tooltip>
        </div>
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className="text-[10px]">Auto-saved</span>
        )}
      </div>
      <Textarea
        className="whitespace-pre-wrap border border-slate-200 text-sm text-slate-600 placeholder:text-slate-400"
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
