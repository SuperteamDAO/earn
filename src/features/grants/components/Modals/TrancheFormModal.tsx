import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { SubmissionTerms } from '@/features/listings/components/Submission/SubmissionTerms';

import { userApplicationQuery } from '../../queries/user-application';
import { type Grant } from '../../types';

const trancheFormSchema = z.object({
  projectUpdate: z.string().min(1, 'Project update is required'),
  helpWanted: z.string().min(1, 'Help wanted details are required'),
});

type TrancheFormValues = z.infer<typeof trancheFormSchema>;

interface Props {
  grant: Grant;
  applicationId: string;
  onClose: () => void;
}

export const TrancheFormModal = ({ grant, applicationId, onClose }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { refetchUser } = useUser();

  const form = useForm<TrancheFormValues>({
    resolver: zodResolver(trancheFormSchema),
    defaultValues: {
      projectUpdate: '',
      helpWanted: '',
    },
  });

  const onSubmit = async (values: TrancheFormValues) => {
    try {
      setIsSubmitting(true);
      await api.post('/api/grant-application/request-tranche', {
        ...values,
        applicationId,
      });
      form.reset();
      await queryClient.invalidateQueries({
        queryKey: userApplicationQuery(grant.id).queryKey,
      });
      await refetchUser();
      toast.success('Tranche request submitted successfully');
      onClose();
    } catch (error: any) {
      console.error('Error submitting tranche request:', error);
      toast.error(
        error.response?.data?.message || 'Failed to submit tranche request',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <DialogTitle className="border-b px-8 py-6 text-lg tracking-normal text-slate-700 sm:text-xl">
        Tranche Request Form
        <p className="mt-3 text-sm font-medium text-slate-700">
          Only apply for a tranche if you have made significant progress.
          Tranches will be split as follows:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm font-normal text-slate-500">
          <li>
            Grants up to $5000, 50% will be paid upfront after KYC verification,
            and 50% upon project completion.
          </li>
          <li>
            Grants upwards of $5000, 30% after KYC verification, 30% upon
            completion of reported milestone/KPI during grant application, and
            40% upon project completion.
          </li>
        </ul>
      </DialogTitle>
      <div className="px-8 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormFieldWrapper
              control={form.control}
              name="projectUpdate"
              label="Share an update about your project"
              description="Tell us about the progress you have made on the project so far."
              isRequired
              isRichEditor
              richEditorPlaceholder="Write your project update..."
            />

            <FormFieldWrapper
              control={form.control}
              name="helpWanted"
              label="Any help wanted?"
              description="Beyond funding, please detail specific challenges and how our expertise/resources can assist your project's success."
              isRequired
              isRichEditor
              richEditorPlaceholder="Enter details..."
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Tranche Request'}
            </Button>
          </form>
        </Form>
        <p className="text-xxs mt-3 w-full pb-6 text-center text-slate-400 sm:pb-0 sm:text-xs">
          By applying to this tranche request, you agree to our{' '}
          <button
            type="button"
            onClick={() => setIsTOSModalOpen(true)}
            className="cursor-pointer underline underline-offset-2"
            rel="noopener noreferrer"
          >
            Terms of Use
          </button>
          .
        </p>
      </div>
      {grant?.sponsor?.name && (
        <SubmissionTerms
          entityName={grant.sponsor.entityName}
          isOpen={isTOSModalOpen}
          onClose={() => setIsTOSModalOpen(false)}
          sponsorName={grant.sponsor.name}
        />
      )}
    </div>
  );
};
