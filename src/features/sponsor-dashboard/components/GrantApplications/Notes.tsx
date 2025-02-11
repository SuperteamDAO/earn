import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

import { type GrantApplicationAi } from '@/features/grants/types';

import { selectedGrantApplicationAtom } from '../../atoms';
import { type GrantApplicationWithUser } from '../../types';

const MAX_CHARACTERS = 500;

type Props = {
  slug: string | undefined;
};

export const Notes = ({ slug }: Props) => {
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );
  const [notes, setNotes] = useState(selectedApplication?.notes);
  console.log('notes', notes);
  useEffect(() => {
    console.log('selectedApplication?.notes', selectedApplication?.notes);
    setNotes(selectedApplication?.notes);
  }, [selectedApplication]);
  const queryClient = useQueryClient();
  const applicationId = useMemo(
    () => selectedApplication?.id,
    [selectedApplication],
  );

  const { mutate: updateNotes, isPending: isSaving } = useMutation({
    mutationFn: (content: string) =>
      api.post('/api/sponsor-dashboard/grants/update-notes', {
        id: applicationId,
        notes: content,
      }),
    onSuccess: (_, variables) => {
      queryClient.setQueriesData<GrantApplicationWithUser[]>(
        {
          predicate: (query) =>
            query.queryKey[0] === 'sponsor-applications' &&
            query.queryKey.includes(slug),
        },
        (old) =>
          old?.map((application) =>
            application.id === applicationId
              ? { ...application, notes: variables }
              : application,
          ),
      );
      if (selectedApplication) {
        setSelectedApplication({
          ...selectedApplication,
          notes: variables,
        });
      }
    },
    onError: (error) => {
      console.error('Error saving notes:', error);
    },
  });

  const debouncedUpdateNotes = useCallback(
    debounce((content: string) => updateNotes(content), 1000),
    [applicationId, updateNotes],
  );

  useEffect(() => {
    if (selectedApplication && notes) debouncedUpdateNotes(notes);
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
      if (selectedApplication) {
        setSelectedApplication({
          ...selectedApplication,
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
      const textBeforeCursor = notes?.slice(0, cursorPosition) || '';
      const textAfterCursor = notes?.slice(cursorPosition) || '';
      setNotes(`${textBeforeCursor}\n• ${textAfterCursor}`);
    } else if (e.key === 'Backspace') {
      const lines = notes?.split('\n') || [];
      if (lines[lines.length - 1] === '• ' && lines.length > 1) {
        e.preventDefault();
        setNotes(notes?.slice(0, -3));
      }
    }
  };

  return (
    <div className="flex w-full flex-col items-start">
      <div className="mb-2 flex w-full items-center justify-between text-slate-400">
        <div className="flex gap-2">
          {(selectedApplication?.ai as GrantApplicationAi)?.commited && (
            <img src="/assets/ai-wand.svg" alt="Auto Review AI" />
          )}
          <span className="font-extrabold">Review Notes</span>
        </div>
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className="text-[10px]">Auto-saved</span>
        )}
      </div>
      <Textarea
        className="whitespace-pre-wrap border-none text-sm text-slate-600 placeholder:text-slate-400"
        key={applicationId}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="• Start typing notes here"
        rows={20}
        value={notes || ''}
      />
      <p className="mt-1 text-xs text-slate-400">
        {MAX_CHARACTERS - (notes?.length || 0)} characters remaining
      </p>
    </div>
  );
};
