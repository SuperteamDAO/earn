import debounce from 'lodash.debounce';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { postJson } from '@/lib/fetch-json';

import {
  convertTextToNotesHTML,
  getTextCharacterCount,
} from '../../utils/convertTextToNotesHTML';
import { NotesRichEditor } from '../NotesRichEditor';
import { useGrantReview } from './GrantReviewContext';

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

export const Notes = (_: Props) => {
  const {
    selectedApplication,
    setSelectedApplication,
    setApplications,
    setStateUpdating: setNotesUpdating,
  } = useGrantReview();
  const [notes, setNotes] = useState(() =>
    normalizeNotesForEditor(selectedApplication?.notes),
  );
  const applicationId = useMemo(
    () => selectedApplication?.id,
    [selectedApplication],
  );
  const previousApplicationIdRef = useRef<string | undefined>(
    selectedApplication?.id,
  );

  const [isSaving, setIsSaving] = useState(false);
  const updateNotes = useCallback(
    async (content: string) => {
      setIsSaving(true);
      try {
        await postJson('/api/sponsor-dashboard/grants/update-notes/', {
          id: applicationId,
          notes: content,
        });
        setApplications((applications) =>
          applications.map((application) =>
            application.id === applicationId
              ? { ...application, notes: content }
              : application,
          ),
        );
        setSelectedApplication((application) =>
          application && application.id === applicationId
            ? { ...application, notes: content }
            : application,
        );
      } catch (error) {
        console.error('Error saving notes:', error);
      } finally {
        setIsSaving(false);
        setNotesUpdating(false);
      }
    },
    // oxlint-disable-next-line react/memo-dependencies -- the context's setters
    [applicationId, setApplications, setSelectedApplication, setNotesUpdating],
  );

  const debouncedUpdateNotesRef = useRef<
    ReturnType<typeof debounce> | undefined
  >(undefined);

  useEffect(() => {
    debouncedUpdateNotesRef.current = debounce(
      (content: string) => void updateNotes(content),
      1000,
    );

    return () => {
      debouncedUpdateNotesRef.current?.cancel();
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- a fresh debounce per application, as Earn
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-start rounded-xl border border-slate-200 py-5 pr-1 pl-4">
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
