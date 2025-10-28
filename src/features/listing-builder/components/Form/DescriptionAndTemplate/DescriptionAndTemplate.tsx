'use client';
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
import styles from '@/styles/listing-description.module.css';

import {
  descriptionKeyAtom,
  isEditingAtom,
  submitListingMutationAtom,
} from '@/features/listing-builder/atoms';

import { useListingForm } from '../../../hooks';
import { Templates } from './Templates';

export function DescriptionAndTemplate() {
  const form = useListingForm();
  const isEditing = useAtomValue(isEditingAtom);
  const submitMutation = useAtomValue(submitListingMutationAtom);
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
      console.log('Saved original description for image cleanup');
    }
  }, [form]);

  useEffect(() => {
    setDescriptionKey(`editor-${templateId || 'default'}`);
  }, [templateId, setDescriptionKey]);

  useEffect(() => {
    const processCleanup = () => {
      if (
        submitMutation.isPending ||
        submitMutation.isSuccess ||
        submitMutation.isError
      ) {
        console.log('Skipping cleanup - submit mutation is active/completed');
        return;
      }

      if (typeof window !== 'undefined') {
        if (isEditing && window.__processOrphanedImageCleanup) {
          console.log('Processing orphaned image cleanup (edit mode)');
          try {
            window.__processOrphanedImageCleanup(
              originalDescriptionRef.current || '',
            );
          } catch (error) {
            console.error('Failed to process orphaned image cleanup:', error);
          }
        } else if (!isEditing && window.__processImageCleanup) {
          console.log('Processing image cleanup (draft mode)');
          try {
            window.__processImageCleanup();
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
  }, [
    isEditing,
    submitMutation.isPending,
    submitMutation.isSuccess,
    submitMutation.isError,
  ]);

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
                    folderName: 'listing-description',
                    type: 'description',
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
