import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import TextareaAutosize from 'react-textarea-autosize';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';

import { aiGenerateFormSchema, type AiGenerateFormValues } from './schema';

interface DescriptionFormProps {
  onSubmit: (data: AiGenerateFormValues) => void;
  initialData: Partial<AiGenerateFormValues>;
}

export function AiGenerateForm({
  onSubmit,
  initialData,
}: DescriptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AiGenerateFormValues>({
    resolver: zodResolver(aiGenerateFormSchema),
    defaultValues: {
      companyDescription: initialData.companyDescription || '',
      scopeOfWork: initialData.scopeOfWork || '',
      rewards: initialData.rewards || '',
      requirements: initialData.requirements || '',
    },
  });

  const handleSubmit = async (data: AiGenerateFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          Use AI to generate your description
        </h2>
        <p className="font-medium text-gray-500">
          Answer a few short questions and we will generate your description for
          you
        </p>
      </div>

      <ScrollArea className="flex max-h-150 min-h-1 flex-col overflow-y-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="companyDescription"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-sm" isRequired>
                    Short Description about Company/Project
                  </FormLabel>
                  <FormControl>
                    <TextareaAutosize
                      placeholder="A brief description of the sponsor company or a link to their website."
                      minRows={3}
                      className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scopeOfWork"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-sm" isRequired>
                    Scope of Work
                  </FormLabel>
                  <FormControl>
                    <TextareaAutosize
                      placeholder="What exactly would you like participants to do? You can describe the tasks or objectives."
                      className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                      minRows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rewards"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-sm" isRequired>
                    Rewards and Podium Split
                  </FormLabel>
                  <FormControl>
                    <TextareaAutosize
                      placeholder="What are the total rewards for the Bounty? How would you like to split it among the winners (up to 5 podium ranks)?"
                      className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                      minRows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-sm" isRequired>
                    Eligibility/Submission Requirements
                  </FormLabel>
                  <FormControl>
                    <TextareaAutosize
                      placeholder="Do you have any specific requirements participants need to meet?"
                      className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                      minRows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Generating...' : 'Generate'}
            </Button>
          </form>
        </Form>
      </ScrollArea>
    </div>
  );
}
