'use client';

import debounce from 'lodash.debounce';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { postJson } from '@/lib/fetch-json';

import { getTextCharacterCount } from '../../utils/convertTextToNotesHTML';
import { NotesRichEditor } from '../NotesRichEditor';
import { useReview } from './review-state';

const MAX_CHARACTERS = 1000;

// The sponsor's private notes on the open submission, saved a second after
// they stop typing. Mounted per submission (keyed by its id).
export const Notes = () => {
  const {
    selected: selectedSubmission,
    updateSubmissions,
    setUpdating: setNotesUpdating,
  } = useReview();
  const [notes, setNotes] = useState(() => selectedSubmission?.notes);
  const [isSaving, setIsSaving] = useState(false);
  const submissionId = selectedSubmission?.id;

  const debouncedUpdateNotesRef = useRef<
    ReturnType<typeof debounce<(content: string) => void>> | undefined
  >(undefined);

  useEffect(() => {
    const updateNotes = (content: string) => {
      if (!submissionId) return;
      setIsSaving(true);
      postJson('/api/sponsor-dashboard/submission/update-notes/', {
        id: submissionId,
        notes: content,
      })
        .catch((error: unknown) => {
          console.error('Error saving notes:', error);
        })
        .finally(() => {
          setIsSaving(false);
          setNotesUpdating(false);
        });
    };
    debouncedUpdateNotesRef.current = debounce(updateNotes, 1000);

    return () => {
      debouncedUpdateNotesRef.current?.cancel();
    };
  }, [submissionId, setNotesUpdating]);

  const handleChange = (value: string) => {
    // Extract plain text for character counting
    const textLength = getTextCharacterCount(value);

    if (textLength <= MAX_CHARACTERS) {
      updateSubmissions((submission) =>
        submission.id === submissionId
          ? { ...submission, notes: value }
          : submission,
      );
      setNotes(value);
      debouncedUpdateNotesRef.current?.(value);
      setNotesUpdating(true);
    }
  };

  return (
    <div className="flex w-full flex-col items-start rounded-xl border border-slate-200 py-5 pr-1 pl-4">
      <div className="mb-2 flex w-full items-center justify-between pr-3 text-slate-400">
        <div className="flex items-center gap-1">
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
