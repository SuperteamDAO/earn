/* oxlint-disable no-underscore-dangle -- the editor's image cleanup hooks are window globals */
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';

import { MinimalTiptapEditor } from '@/components/tiptap';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  descriptionKeyAtom,
  isEditingAtom,
  submitStatusAtom,
} from '@/features/listing-builder/atoms';

import { useListingForm } from '../../../hooks';
import { Templates } from './Templates';

import styles from '@/styles/listing-description.module.css';

export function DescriptionAndTemplate() {
  const form = useListingForm();
  const isEditing = useAtomValue(isEditingAtom);
  const submitStatus = useAtomValue(submitStatusAtom);
  const templateId = useWatch({
    control: form.control,
    name: 'templateId',
  });
  const [descriptionKey, setDescriptionKey] = useAtom(descriptionKeyAtom);

  const originalDescriptionRef = useRef<string | null>(null);

  useEffect(() => {
    const currentDescription = form.getValues('description');
    if (originalDescriptionRef.current === null) {
      originalDescriptionRef.current = currentDescription || '';
    }
  }, [form]);

  useEffect(() => {
    setDescriptionKey(`editor-${templateId || 'default'}`);
  }, [templateId, setDescriptionKey]);

  useEffect(() => {
    const processCleanup = () => {
      if (submitStatus !== 'idle') {
        return;
      }

      if (typeof window !== 'undefined') {
        if (isEditing && window.__processOrphanedImageCleanup) {
          try {
            void window.__processOrphanedImageCleanup(
              originalDescriptionRef.current || '',
            );
          } catch (error) {
            console.error('Failed to process orphaned image cleanup:', error);
          }
        } else if (!isEditing && window.__processImageCleanup) {
          try {
            void window.__processImageCleanup();
          } catch (error) {
            console.error('Failed to process image cleanup:', error);
          }
        }
      }
    };

    const handleBeforeUnload = () => {
      processCleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing, submitStatus]);

  // Leaving the builder within Earn (the App Router has no route events):
  // the same cleanup, once, as the editor unmounts.
  const submitStatusRef = useRef(submitStatus);
  useEffect(() => {
    submitStatusRef.current = submitStatus;
  }, [submitStatus]);
  useEffect(
    () => () => {
      if (submitStatusRef.current !== 'idle') return;
      if (isEditing && window.__processOrphanedImageCleanup) {
        try {
          void window.__processOrphanedImageCleanup(
            originalDescriptionRef.current || '',
          );
        } catch (error) {
          console.error('Failed to process orphaned image cleanup:', error);
        }
      } else if (!isEditing && window.__processImageCleanup) {
        try {
          void window.__processImageCleanup();
        } catch (error) {
          console.error('Failed to process image cleanup:', error);
        }
      }
    },
    [isEditing],
  );

  return (
    <FormField
      name="description"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <div className="flex items-center justify-between">
              <FormLabel isRequired>Description</FormLabel>
              <div className="flex items-center gap-2">
                <Templates />
              </div>
            </div>
            <div className="ring-primary flex rounded-md border has-focus:ring-1">
              <FormControl>
                <MinimalTiptapEditor
                  key={descriptionKey}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    form.saveDraft();
                  }}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="min-h-[60vh] w-full border-0"
                  editorContentClassName={`${styles.content} mt-4 mb-4 px-2 h-full [&>*:first-child>*:first-child]:mt-0!`}
                  output="html"
                  placeholder="Type your description here..."
                  editable={true}
                  editorClassName="focus:outline-hidden"
                  imageSetting={{
                    source: 'description',
                  }}
                  toolbarClassName="sticky top-18 bg-white z-10"
                />
              </FormControl>
            </div>
            <FormMessage className="ml-auto w-fit" />
          </FormItem>
        );
      }}
    />
  );
}
