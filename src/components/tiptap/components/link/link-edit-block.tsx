import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { URL_REGEX } from '@/constants/URL_REGEX';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

const formSchema = z.object({
  url: z
    .string()
    .regex(URL_REGEX, 'Invalid URL')
    .transform((url) => {
      return getURLSanitized(url);
    }),
  text: z.string().optional(),
  isNewTab: z.boolean().default(false),
});

interface LinkEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultUrl?: string;
  defaultText?: string;
  defaultIsNewTab?: boolean;
  onSave: (url: string, text?: string, isNewTab?: boolean) => void;
}

export const LinkEditBlock = React.forwardRef<HTMLDivElement, LinkEditorProps>(
  ({ onSave, defaultIsNewTab, defaultUrl, defaultText, className }, ref) => {
    const formRef = React.useRef<HTMLDivElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        url: defaultUrl,
        text: defaultText,
        isNewTab: defaultIsNewTab,
      },
      mode: 'onTouched',
    });

    React.useImperativeHandle(ref, () => formRef.current as HTMLDivElement);

    const handleSubmit = async (data: z.infer<typeof formSchema>) => {
      onSave(data.url, data.text, data.isNewTab);
    };

    return (
      <div ref={formRef}>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className={cn('space-y-4', className)}
          >
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="gap-2">
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem className="gap-2">
                  <FormLabel>Display Text (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter display text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isNewTab"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-2">
                  <FormLabel>Open in New Tab</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  form.handleSubmit(handleSubmit)();
                }}
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  },
);

LinkEditBlock.displayName = 'LinkEditBlock';
