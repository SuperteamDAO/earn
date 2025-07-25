import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';

import { MinimalTiptapEditor } from '@/components/tiptap';
import { Button } from '@/components/ui/button';
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
import { AiGenerateDialog } from '../../AiGenerate/Dialog';
import { Templates } from './Templates';

export function DescriptionAndTemplate() {
  const form = useListingForm();
  const router = useRouter();
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

    const handleRouteStart = () => {
      processCleanup();
    };

    const handleBeforeUnload = () => {
      processCleanup();
    };

    router.events.on('routeChangeStart', handleRouteStart);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      router.events.off('routeChangeStart', handleRouteStart);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    router.events,
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
                <AiGenerateDialog>
                  <Button className="ph-no-capture h-8 rounded-lg bg-transparent p-0 shadow-none hover:bg-transparent">
                    <div className="group bg-background relative inline-flex h-full overflow-hidden rounded-lg p-[0.125rem] focus:outline-hidden">
                      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF79C1_0%,#76C5FF_50%,#FF79C1_100%)]" />
                      <span className="ph-no-capture bg-background inline-flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-1 text-xs font-medium text-slate-500 backdrop-blur-3xl group-hover:bg-slate-50">
                        <img
                          src="/assets/ai-wand.svg"
                          alt="Auto Generate GPT"
                        />
                        Auto Generate
                      </span>
                    </div>
                  </Button>
                </AiGenerateDialog>
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
                  className="min-h-[60vh] w-full border-0 text-sm"
                  editorContentClassName={`${styles.content} mt-4 mb-4 px-2 h-full`}
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
