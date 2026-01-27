import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { MultiImageUploader } from '@/components/shared/MultiImageUploader';
import { Button } from '@/components/ui/button';
import { DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { validateSolAddress } from '@/utils/validateSolAddress';

import { SubmissionTerms } from '@/features/listings/components/Submission/SubmissionTerms';

import { userApplicationQuery } from '../../queries/user-application';
import { type Grant } from '../../types';
import {
  isTouchingGrassGrant,
  TOUCHING_GRASS_COPY,
} from '../../utils/touchingGrass';

const createTrancheFormSchema = (isTouchingGrass: boolean) =>
  z
    .object({
      walletAddress: z.string().min(1, 'Solana Wallet Address is required'),
      projectUpdate: z.string().min(1, 'Project update is required'),
      helpWanted: z.string().optional(),
      eventPictures: isTouchingGrass
        ? z.array(z.string()).min(1, 'At least one event picture is required')
        : z.array(z.string()).optional(),
      eventReceipts: isTouchingGrass
        ? z.array(z.string()).min(1, 'At least one receipt is required')
        : z.array(z.string()).optional(),
      attendeeCount: isTouchingGrass
        ? z.number().min(1, 'Attendee count is required')
        : z.number().optional(),
      socialPost: isTouchingGrass
        ? z.string().min(1, 'Social post link is required')
        : z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.walletAddress) {
        const validate = validateSolAddress(data.walletAddress);
        if (!validate) {
          ctx.addIssue({
            code: 'custom',
            path: ['walletAddress'],
            message: 'Invalid Solana Wallet Address',
          });
        }
      }
    });

interface Props {
  grant: Grant;
  applicationId: string;
  onClose: () => void;
}

export const TrancheFormModal = ({ grant, applicationId, onClose }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user, refetchUser } = useUser();
  const isTouchingGrass = isTouchingGrassGrant(grant);

  const trancheFormSchema = useMemo(
    () => createTrancheFormSchema(isTouchingGrass),
    [isTouchingGrass],
  );

  type TrancheFormValues = z.infer<typeof trancheFormSchema>;

  const { data: grantApplication } = useQuery(userApplicationQuery(grant.id));

  const lastWalletAddress =
    grantApplication?.GrantTranche?.length &&
    grantApplication.GrantTranche.length > 0
      ? grantApplication.GrantTranche[grantApplication.GrantTranche.length - 1]
          ?.walletAddress
      : grantApplication?.walletAddress;

  const form = useForm<TrancheFormValues>({
    resolver: zodResolver(trancheFormSchema),
    defaultValues: {
      walletAddress: lastWalletAddress || '',
      projectUpdate: '',
      helpWanted: '',
      eventPictures: [],
      eventReceipts: [],
      attendeeCount: undefined,
      socialPost: '',
    },
  });

  const onSubmit = async (values: TrancheFormValues) => {
    try {
      setIsSubmitting(true);
      await api.post('/api/grant-application/request-tranche', {
        applicationId,
        walletAddress: values.walletAddress,
        projectUpdate: values.projectUpdate,
        helpWanted: values.helpWanted,
        ...(isTouchingGrass && {
          eventPictures: values.eventPictures,
          eventReceipts: values.eventReceipts,
          attendeeCount: values.attendeeCount,
          socialPost: values.socialPost,
        }),
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

  const currentWalletAddress = form.watch('walletAddress');
  const isSameAsEmbeddedWallet =
    currentWalletAddress?.toLowerCase() === user?.walletAddress?.toLowerCase();

  return (
    <div>
      <DialogTitle className="border-b px-8 py-6 text-lg tracking-normal text-slate-700 sm:text-xl">
        {isTouchingGrass
          ? TOUCHING_GRASS_COPY.tranche.title
          : 'Tranche Request Form'}
        <p className="mt-3 text-sm font-medium text-slate-700">
          {isTouchingGrass
            ? TOUCHING_GRASS_COPY.tranche.subtitle
            : 'Only apply for a tranche if you have made significant progress. Tranches will be split as follows:'}
        </p>
        {isTouchingGrass ? (
          <p className="mt-2 text-sm font-normal text-slate-500">
            {TOUCHING_GRASS_COPY.tranche.description}
          </p>
        ) : (
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm font-normal text-slate-500">
            <li>
              Grants up to $5000, 50% will be paid upfront after KYC
              verification, and 50% upon project completion.
            </li>
            <li>
              Grants upwards of $5000, 30% after KYC verification, 30% upon
              completion of reported milestone/KPI during grant application, and
              40% upon project completion.
            </li>
          </ul>
        )}
      </DialogTitle>
      <div className="px-8 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormFieldWrapper
              control={form.control}
              name="projectUpdate"
              label={
                isTouchingGrass
                  ? TOUCHING_GRASS_COPY.tranche.projectUpdate.label
                  : 'Share an update about your project'
              }
              description={
                isTouchingGrass
                  ? TOUCHING_GRASS_COPY.tranche.projectUpdate.description
                  : 'Tell us about the progress you have made on the project so far.'
              }
              isRequired
              isRichEditor
              richEditorPlaceholder={
                isTouchingGrass
                  ? TOUCHING_GRASS_COPY.tranche.projectUpdate.placeholder
                  : 'Write your project update...'
              }
            />

            {isTouchingGrass && (
              <>
                <FormField
                  control={form.control}
                  name="eventPictures"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <MultiImageUploader
                        source="grant-event-pictures"
                        value={(field.value as string[]) || []}
                        onChange={field.onChange}
                        maxImages={5}
                        minImages={1}
                        label={TOUCHING_GRASS_COPY.tranche.eventPictures.label}
                        description={
                          TOUCHING_GRASS_COPY.tranche.eventPictures.description
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventReceipts"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <MultiImageUploader
                        source="grant-event-receipts"
                        value={(field.value as string[]) || []}
                        onChange={field.onChange}
                        maxImages={10}
                        minImages={1}
                        label={TOUCHING_GRASS_COPY.tranche.eventReceipts.label}
                        description={
                          TOUCHING_GRASS_COPY.tranche.eventReceipts.description
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attendeeCount"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <div>
                        <FormLabel isRequired>
                          {TOUCHING_GRASS_COPY.tranche.attendeeCount.label}
                        </FormLabel>
                        <FormDescription>
                          {
                            TOUCHING_GRASS_COPY.tranche.attendeeCount
                              .description
                          }
                        </FormDescription>
                      </div>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={
                              TOUCHING_GRASS_COPY.tranche.attendeeCount
                                .placeholder
                            }
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value ? parseInt(value, 10) : undefined,
                              );
                            }}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className="pt-1" />
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem className={cn('flex flex-col gap-2')}>
                  <div>
                    <FormLabel isRequired>
                      {isTouchingGrass
                        ? TOUCHING_GRASS_COPY.tranche.walletAddress.label
                        : 'Wallet address for receiving this tranche'}
                    </FormLabel>
                    <FormDescription>
                      {isTouchingGrass
                        ? TOUCHING_GRASS_COPY.tranche.walletAddress.description
                        : 'This field is pre-filled with the wallet address you last added for this grant project. If you want to receive the grant tranche payment in a new wallet, please update this field.'}
                    </FormDescription>
                  </div>
                  <div>
                    <FormControl>
                      <Input
                        placeholder="Add your Solana wallet address"
                        {...field}
                      />
                    </FormControl>
                    {!isTouchingGrass && !isSameAsEmbeddedWallet && (
                      <p className="pt-0.5 text-xs text-slate-500">
                        <span
                          className="cursor-pointer underline"
                          onClick={() => {
                            if (user?.walletAddress) {
                              form.setValue(
                                'walletAddress',
                                user.walletAddress,
                              );
                            }
                          }}
                        >
                          Click here
                        </span>{' '}
                        to auto-fill this field with your Earn embedded wallet
                        address
                      </p>
                    )}
                    <FormMessage className="pt-1" />
                  </div>
                </FormItem>
              )}
            />

            {isTouchingGrass && (
              <FormFieldWrapper
                control={form.control}
                name="socialPost"
                label={TOUCHING_GRASS_COPY.tranche.socialPost.label}
                description={TOUCHING_GRASS_COPY.tranche.socialPost.description}
                isRequired
              >
                <Input
                  placeholder={
                    TOUCHING_GRASS_COPY.tranche.socialPost.placeholder
                  }
                />
              </FormFieldWrapper>
            )}

            <FormFieldWrapper
              control={form.control}
              name="helpWanted"
              label={
                isTouchingGrass
                  ? TOUCHING_GRASS_COPY.tranche.helpWanted.label
                  : 'Any help wanted?'
              }
              description={
                isTouchingGrass
                  ? TOUCHING_GRASS_COPY.tranche.helpWanted.description
                  : "Beyond funding, please detail specific challenges and how our expertise/resources can assist your project's success."
              }
              isRichEditor
              richEditorPlaceholder="Enter details..."
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Tranche Request'}
            </Button>
          </form>
        </Form>
        <p className="text-xxs mt-3 w-full pb-6 text-center text-slate-400 sm:pb-0 sm:text-xs">
          {isTouchingGrass
            ? TOUCHING_GRASS_COPY.tranche.terms
            : 'By applying to this tranche request, you agree to our '}
          {!isTouchingGrass && (
            <button
              type="button"
              onClick={() => setIsTOSModalOpen(true)}
              className="cursor-pointer underline underline-offset-2"
              rel="noopener noreferrer"
            >
              Terms of Use
            </button>
          )}
          {!isTouchingGrass && '.'}
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
