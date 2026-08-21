import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import debounce from 'lodash.debounce';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api';
import { Wand } from '@/svg/wand';
import { cn } from '@/utils/cn';

import { type GrantApplicationAi } from '@/features/grants/types';

import { isStateUpdatingAtom, selectedGrantApplicationAtom } from '../../atoms';
import { type GrantApplicationsReturn } from '../../queries/applications';
import {
  convertTextToNotesHTML,
  getTextCharacterCount,
} from '../../utils/convertTextToNotesHTML';
import { NotesRichEditor } from '../NotesRichEditor';

const MAX_CHARACTERS = 2000;

const isHtmlNote = (value?: string | null) =>
  /<\/?[a-z][\s\S]*>/i.test(value || '');

const normalizeNotesForEditor = (value?: string | null) => {
  if (!value || isHtmlNote(value)) return value;
  return convertTextToNotesHTML(value);
};

type Props = {
  slug: string | undefined;
};

export const Notes = ({ slug }: Props) => {
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );
  const setNotesUpdating = useSetAtom(isStateUpdatingAtom);
  const [notes, setNotes] = useState(() =>
    normalizeNotesForEditor(selectedApplication?.notes),
  );
  const queryClient = useQueryClient();
  const applicationId = useMemo(
    () => selectedApplication?.id,
    [selectedApplication],
  );
  const previousApplicationIdRef = useRef<string | undefined>(
    selectedApplication?.id,
  );

  const { mutate: updateNotes, isPending: isSaving } = useMutation({
    mutationFn: (content: string) =>
      api.post('/api/sponsor-dashboard/grants/update-notes', {
        id: applicationId,
        notes: content,
      }),
    onSuccess: (_, variables) => {
      queryClient.setQueriesData<GrantApplicationsReturn>(
        {
          predicate: (query) =>
            query.queryKey[0] === 'sponsor-applications' &&
            query.queryKey.includes(slug),
        },
        (old) => {
          if (!old) return old;
          const data = old?.data.map((application) =>
            application.id === applicationId
              ? { ...application, notes: variables }
              : application,
          );
          return {
            ...old,
            data,
          };
        },
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
    onSettled: () => {
      setNotesUpdating(false);
    },
  });

  const debouncedUpdateNotesRef = useRef<
    ReturnType<typeof debounce> | undefined
  >(undefined);

  useEffect(() => {
    debouncedUpdateNotesRef.current = debounce(
      (content: string) => updateNotes(content),
      1000,
    );

    return () => {
      debouncedUpdateNotesRef.current?.cancel();
    };
  }, [applicationId, updateNotes]);

  useEffect(() => {
    if (previousApplicationIdRef.current !== selectedApplication?.id) {
      previousApplicationIdRef.current = selectedApplication?.id;
      setNotes(normalizeNotesForEditor(selectedApplication?.notes));
    }
  }, [selectedApplication?.id, selectedApplication?.notes]);

  const handleChange = (value: string) => {
    const textLength = getTextCharacterCount(value);

    if (textLength <= MAX_CHARACTERS) {
      if (selectedApplication) {
        setSelectedApplication({
          ...selectedApplication,
          notes: value,
        });
      }
      setNotes(value);
      debouncedUpdateNotesRef.current?.(value);
      setNotesUpdating(true);
    }
  };

  const isAiCommited = useMemo(
    () => (selectedApplication?.ai as GrantApplicationAi)?.commited,
    [selectedApplication],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-start rounded-xl border border-slate-200 py-5 pr-1 pl-4">
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
        key={applicationId + (selectedApplication?.label || 'label')}
        className="min-h-0 w-full flex-1"
      >
        <NotesRichEditor
          className="h-full min-h-0 w-full resize-none !border-0 py-0 text-sm whitespace-pre-wrap text-slate-500 !shadow-none !ring-0 placeholder:text-slate-400 focus:!border-0 focus:!shadow-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!outline-hidden"
          key={applicationId + (selectedApplication?.label || 'label')}
          id={applicationId + (selectedApplication?.label || 'label')}
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
