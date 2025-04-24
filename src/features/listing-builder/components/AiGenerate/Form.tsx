import { zodResolver } from '@hookform/resolvers/zod';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import TextareaAutosize from 'react-textarea-autosize';

import { Badge } from '@/components/ui/badge';
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
import { Wand } from '@/svg/wand';

import { hackathonsAtom } from '../../atoms';
import { MAX_BONUS_SPOTS, MAX_PODIUMS } from '../../constants';
import { useListingForm } from '../../hooks';
import { aiGenerateFormSchema, type AiGenerateFormValues } from './schema';

interface DescriptionFormProps {
  onSubmit: (data: AiGenerateFormValues) => Promise<void>;
  initialData: Partial<AiGenerateFormValues>;
  resetForm: () => void;
}

export function AiGenerateForm({
  onSubmit,
  initialData,
  resetForm,
}: DescriptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const listingForm = useListingForm();
  const type = useWatch({
    control: listingForm.control,
    name: 'type',
  });
  const hackathonId = useWatch({
    control: listingForm.control,
    name: 'hackathonId',
  });

  const hackathons = useAtomValue(hackathonsAtom);

  const form = useForm<AiGenerateFormValues>({
    resolver: zodResolver(aiGenerateFormSchema),
    defaultValues: {
      companyDescription: initialData.companyDescription || '',
      scopeOfWork: initialData.scopeOfWork || '',
      rewards: initialData.rewards || '',
      requirements: initialData.requirements || '',
      type,
      hackathonName: '',
    },
  });

  const handleSubmit = async (data: AiGenerateFormValues) => {
    setIsSubmitting(true);
    try {
      const hackathonName = hackathonId
        ? hackathons?.find((s) => s.id === hackathonId)?.name
        : null;
      await onSubmit({
        ...data,
        type,
        hackathonName: hackathonName || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="flex items-start gap-2">
          <span className="flex items-center gap-2">
            <Wand />
            <h2 className="text-xl font-semibold">
              Use AI to generate your description
            </h2>
          </span>
          <Badge
            variant="secondary"
            className="ml-auto h-fit px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase"
          >
            {type}
          </Badge>
        </span>
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
                      placeholder={`A brief description of your company/project, link to your official website, you're companies values, etc`}
                      minRows={3}
                      className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                      {...field}
                    />
                  </FormControl>
                  <span className="flex justify-between">
                    <FormMessage />
                    <div className="mr-4 ml-auto text-xs text-slate-400">
                      {field.value?.length < 50
                        ? `Add at least ${50 - (field.value?.length || 0)} more characters`
                        : ``}
                    </div>
                  </span>
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
                      placeholder={
                        type !== 'project'
                          ? 'What exactly would you like participant to do? You can describe the tasks or objectives here.'
                          : 'What exactly would you like applicant to do? You can describe the roles and responsibilies here.'
                      }
                      className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                      minRows={3}
                      {...field}
                    />
                  </FormControl>
                  <span className="flex justify-between">
                    <FormMessage />
                    <div className="mr-4 ml-auto text-xs text-slate-400">
                      {field.value?.length < 50
                        ? `Add at least ${50 - (field.value?.length || 0)} more characters`
                        : ``}
                    </div>
                  </span>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rewards"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-sm" isRequired>
                    {type === 'project'
                      ? 'Compensation Structure'
                      : 'Rewards and Podium Split'}
                  </FormLabel>
                  <FormControl>
                    <TextareaAutosize
                      placeholder={
                        type !== 'project'
                          ? `What are the total rewards for the Bounty? How would you like to split it among the winners? (we allow ${MAX_PODIUMS} podiums and ${MAX_BONUS_SPOTS} bonuses)`
                          : `What is the total compensation you will be providing to your selected applicant? (we allow fixed, range and variable payment)`
                      }
                      className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                      minRows={3}
                      {...field}
                    />
                  </FormControl>
                  <span className="flex justify-between">
                    <FormMessage />
                    <div className="mr-4 ml-auto text-xs text-slate-400">
                      {field.value?.length < 10
                        ? `Add at least ${10 - (field.value?.length || 0)} more characters`
                        : ``}
                    </div>
                  </span>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormLabel className="text-sm" isRequired>
                    {type === 'project'
                      ? `Evaluation Criteria / Qualifications`
                      : `Submission Requirements and Judging Criteria`}
                  </FormLabel>
                  <FormControl>
                    <TextareaAutosize
                      placeholder={
                        type !== 'project'
                          ? `What are the requirements that the participant needs to meet? Also mention your judging criterias for quality submission`
                          : `What are your evaluation criterias or qualitfications that the applicant needs to meet?`
                      }
                      className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                      minRows={3}
                      {...field}
                    />
                  </FormControl>
                  <span className="flex justify-between">
                    <FormMessage />
                    <div className="mr-4 ml-auto text-xs text-slate-400">
                      {field.value?.length < 25
                        ? `Add at least ${25 - (field.value?.length || 0)} more characters`
                        : ``}
                    </div>
                  </span>
                </FormItem>
              )}
            />
            <div className="flex flex-col items-center">
              <Button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Generating...' : 'Generate'}
              </Button>
              <Button
                type="button"
                variant="link"
                className=""
                onClick={() => {
                  form.reset({
                    companyDescription: '',
                    scopeOfWork: '',
                    rewards: '',
                    requirements: '',
                  });
                  resetForm();
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </ScrollArea>
    </div>
  );
}
