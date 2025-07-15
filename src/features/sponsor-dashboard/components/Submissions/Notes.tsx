import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Loader2 } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Textarea } from '@/components/ui/textarea';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { Wand } from '@/svg/wand';
import { cn } from '@/utils/cn';

import { type ProjectApplicationAi } from '@/features/listings/types';

import { isStateUpdatingAtom, selectedSubmissionAtom } from '../../atoms';

const MAX_CHARACTERS = 1000;

type Props = {
  initialNotes?: string;
  slug: string | undefined;
};

export const Notes = ({ slug }: Props) => {
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );
  const setNotesUpdating = useSetAtom(isStateUpdatingAtom);
  const [notes, setNotes] = useState(selectedSubmission?.notes);
  useEffect(() => {
    setNotes(selectedSubmission?.notes);
  }, [selectedSubmission]);
  const queryClient = useQueryClient();
  const submissionId = useMemo(
    () => selectedSubmission?.id,
    [selectedSubmission],
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    setNotes(selectedSubmission?.notes);
  }, [selectedSubmission]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.stopPropagation();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const cursorPosition = e.currentTarget.selectionStart;
      const textBeforeCursor = notes?.slice(0, cursorPosition);
      const textAfterCursor = notes?.slice(cursorPosition);
      const newNotes = `${textBeforeCursor}\n• ${textAfterCursor}`;
      setNotes(newNotes);

      const newCursorPosition = cursorPosition + 3;
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newCursorPosition;
          textareaRef.current.selectionEnd = newCursorPosition;
        }
      });
    } else if (e.key === 'Backspace') {
      const lines = notes?.split('\n') || [];
      if (lines[lines.length - 1] === '• ' && lines.length > 1) {
        e.preventDefault();
        setNotes(notes?.slice(0, -3));
      }
    }
  };

  const isAiCommited = useMemo(
    () => (selectedSubmission?.ai as ProjectApplicationAi)?.commited,
    [selectedSubmission],
  );

  return (
    <div className="flex w-full flex-col items-start rounded-xl border border-slate-200 px-4 py-5">
      <div
        className={cn(
          'mb-2 flex w-full items-center justify-between text-slate-400',
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
      <Textarea
        ref={textareaRef}
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 scrollbar-thumb-rounded-md resize-none !border-0 px-1.5 py-0 text-sm whitespace-pre-wrap text-slate-500 !shadow-none !ring-0 placeholder:text-slate-400 focus:!border-0 focus:!shadow-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-hidden"
        key={submissionId}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="• Start typing notes here"
        rows={20}
        value={notes || ''}
      />
      <p className="mt-1 w-full text-right text-xs text-slate-400">
        {notes?.length || 0}/{MAX_CHARACTERS}
      </p>
    </div>
  );
};
