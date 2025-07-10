import { zodResolver } from '@hookform/resolvers/zod';
import { useAtomValue } from 'jotai';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { easeOutQuad } from '@/utils/easings';

import { hackathonsAtom } from '../../atoms';
import {
  AUTO_GENERATE_STORAGE_KEY,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
} from '../../constants';
import { useListingForm } from '../../hooks';
import { aiGenerateFormSchema, type AiGenerateFormValues } from './schema';

interface DescriptionFormProps {
  onSubmit: (data: AiGenerateFormValues) => Promise<void>;
  initialData: Partial<AiGenerateFormValues>;
  resetForm: () => void;
  onClose: () => void;
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

  useEffect(() => {
    const savedData = localStorage.getItem(AUTO_GENERATE_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && Object.keys(parsedData).length > 0) {
          form.reset({
            ...form.getValues(),
            ...parsedData,
          });
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        localStorage.removeItem(AUTO_GENERATE_STORAGE_KEY);
      }
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((formValues) => {
      if (formValues) {
        const dataToSave = {
          companyDescription: formValues.companyDescription,
          scopeOfWork: formValues.scopeOfWork,
          rewards: formValues.rewards,
          requirements: formValues.requirements,
        };
        localStorage.setItem(
          AUTO_GENERATE_STORAGE_KEY,
          JSON.stringify(dataToSave),
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

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
      localStorage.removeItem(AUTO_GENERATE_STORAGE_KEY);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      form.handleSubmit(handleSubmit)();
    }
  };

  return (
    <div className="mt-2 h-full space-y-4 px-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          onKeyDown={handleKeyDown}
          className="flex h-full flex-col justify-between gap-3"
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
                    autoFocus={true}
                    placeholder={`A brief description of your company/project, link to your official website, you're companies values, etc`}
                    minRows={3}
                    className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                    {...field}
                  />
                </FormControl>
                <span className="flex justify-between">
                  <FormMessage />
                  <div className="mr-4 ml-auto text-xs text-slate-400">
                    {field.value?.trim().length < 25
                      ? `Add at least ${25 - (field.value?.trim().length || 0)} more characters`
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
                    {field.value?.trim().length < 25
                      ? `Add at least ${25 - (field.value?.trim().length || 0)} more characters`
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
                    {field.value?.trim().length < 10
                      ? `Add at least ${10 - (field.value?.trim().length || 0)} more characters`
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
                <FormLabel className="text-sm">
                  {type === 'project'
                    ? `Evaluation Criteria / Qualifications`
                    : `Submission Requirements and Judging Criteria`}
                </FormLabel>
                <FormControl>
                  <TextareaAutosize
                    placeholder={
                      type !== 'project'
                        ? `List down conditions that a submission needs to meet to be considered eligible. Also, list down the judging criteria for picking the winning submissions`
                        : `List down conditions that an applicant needs to meet to be considered eligible. Also, list down the judging criteria for picking the winning application`
                    }
                    className="focus:border-primary rounded-md border p-2 text-sm placeholder:text-sm focus:outline-none"
                    minRows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <motion.div
            className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white py-6 pt-2"
            key="form-footer"
            initial={{
              y: 75,
            }}
            animate={{ y: 0 }}
            exit={{ y: 75 }}
            transition={{ duration: 0.2, ease: easeOutQuad, delay: 0.2 }}
          >
            <Button
              type="button"
              variant="outline"
              className="w-58"
              onClick={() => {
                form.reset({
                  companyDescription: '',
                  scopeOfWork: '',
                  rewards: '',
                  requirements: '',
                });
                localStorage.removeItem(AUTO_GENERATE_STORAGE_KEY);
                resetForm();
              }}
            >
              Reset answers
            </Button>
            <Button type="submit" className="w-58" disabled={isSubmitting}>
              {isSubmitting && (
                <>
                  <Loader2 className="animate-spin" />
                </>
              )}
              {isSubmitting ? 'Generating ' : 'Generate Preview'}
            </Button>
          </motion.div>
        </form>
      </Form>
    </div>
  );
}
