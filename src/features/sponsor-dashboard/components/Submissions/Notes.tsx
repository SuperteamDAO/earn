import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { Wand } from '@/svg/wand';
import { cn } from '@/utils/cn';

import { type ProjectApplicationAi } from '@/features/listings/types';

import { isStateUpdatingAtom, selectedSubmissionAtom } from '../../atoms';
import { getTextCharacterCount } from '../../utils/convertTextToNotesHTML';
import { NotesRichEditor } from '../NotesRichEditor';

const MAX_CHARACTERS = 1000;

type Props = {
  slug: string | undefined;
};

export const Notes = ({ slug }: Props) => {
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );
  const setNotesUpdating = useSetAtom(isStateUpdatingAtom);
  const [notes, setNotes] = useState(selectedSubmission?.notes);

  const queryClient = useQueryClient();
  const submissionId = useMemo(
    () => selectedSubmission?.id,
    [selectedSubmission],
  );

  const { mutate: updateNotes, isPending: isSaving } = useMutation({
    mutationFn: (content: string) =>
      api.post('/api/sponsor-dashboard/submission/update-notes', {
        id: submissionId,
        notes: content,
      }),
    onSuccess: (_, variables) => {
      queryClient.setQueriesData<SubmissionWithUser[]>(
        {
          predicate: (query) =>
            query.queryKey[0] === 'sponsor-submissions' &&
            query.queryKey.includes(slug),
        },
        (old) => {
          if (!old) return old;
          const data = old?.map((submission) =>
            submission.id === submissionId
              ? { ...submission, notes: variables }
              : submission,
          );
          return data;
        },
      );
      if (selectedSubmission) {
        setSelectedSubmission({
          ...selectedSubmission,
          notes: variables,
        });
      }
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

  const handleChange = (value: string) => {
    // Extract plain text for character counting
    const textLength = getTextCharacterCount(value);

    if (textLength <= MAX_CHARACTERS) {
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

  useEffect(() => {
    setNotes(selectedSubmission?.notes);
  }, [selectedSubmission]);

  const isAiCommited = useMemo(
    () => (selectedSubmission?.ai as ProjectApplicationAi)?.commited,
    [selectedSubmission],
  );

  return (
    <div className="flex w-full flex-col items-start rounded-xl border border-slate-200 py-5 pr-1 pl-4">
      <div
        className={cn(
          'mb-2 flex w-full items-center justify-between pr-3 text-slate-400',
          isAiCommited && 'text-slate-600',
        )}
      >
        <div className="flex items-center gap-1">
          {isAiCommited && <Wand />}
          <span className="font-extrabold">Notes</span>
        </div>
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className="text-[10px]">Auto-saved</span>
        )}
      </div>
      <div
        key={submissionId + (selectedSubmission?.label || 'label')}
        className="h-full w-full"
      >
        <NotesRichEditor
          className="h-full max-h-[25rem] min-h-[25rem] w-full resize-none !border-0 py-0 text-sm whitespace-pre-wrap text-slate-500 !shadow-none !ring-0 placeholder:text-slate-400 focus:!border-0 focus:!shadow-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-hidden"
          key={submissionId + (selectedSubmission?.label || 'label')}
          id={submissionId + (selectedSubmission?.label || 'label')}
          onChange={handleChange}
          placeholder="• Start typing notes here"
          value={notes || ''}
          maxLength={MAX_CHARACTERS}
        />
      </div>

      <p className="mt-1 w-full text-right text-xs text-slate-400">
        {notes ? getTextCharacterCount(notes) : 0}/{MAX_CHARACTERS}
      </p>
    </div>
  );
};
