import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useMemo } from 'react';
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

import { useListingForm } from '../../../hooks';
import { Templates } from './Templates';

export function DescriptionAndTemplate() {
  const form = useListingForm();
  const templateId = useWatch({
    control: form.control,
    name: 'templateId',
  });

  const editorKey = useMemo(
    () => `editor-${templateId || 'default'}`,
    [templateId],
  );
  const posthog = usePostHog();

  return (
    <FormField
      name="description"
      control={form.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <div className="flex items-center justify-between">
              <FormLabel isRequired>Description</FormLabel>
              <div className="flex items-center">
                <Button
                  variant="link"
                  className="px-0 pr-1 text-[0.7rem] text-slate-500"
                  onClick={() => {
                    posthog.capture('AI bot_sponsor');
                  }}
                  asChild
                >
                  <Link
                    href="https://chat.openai.com/g/g-HS6eWTMku-st-earn-listings-bot"
                    target="_blank"
                    className="ph-no-capture"
                  >
                    {'🤖 Go live in <1 min by using our drafting bot'}
                  </Link>
                </Button>
                <Templates />
              </div>
            </div>
            <div className="ring-primary flex rounded-md border has-focus:ring-1">
              <FormControl>
                <MinimalTiptapEditor
                  key={editorKey}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    form.saveDraft();
                  }}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="min-h-[60vh] w-full border-0 text-sm"
                  editorContentClassName="p-4 px-2 h-full"
                  output="html"
                  placeholder="Type your description here..."
                  editable={true}
                  editorClassName="focus:outline-hidden"
                  imageSetting={{
                    folderName: 'listing-description',
                    type: 'description',
                  }}
                  toolbarClassName="sticky top-0 bg-white z-10"
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
