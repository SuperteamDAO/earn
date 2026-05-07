import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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
  AGENTIC_ENGINEERING_GRANT_COPY,
  extractGithubRepoPath,
  getGithubRepoDisplayValue,
  GITHUB_REPO_LABEL,
  GITHUB_REPO_PREFIX,
  isAgenticEngineeringGrant,
  ST_GRANT_COPY,
} from '../../utils/stGrant';
import {
  WALLET_ADDRESS_CONFLICT_CODE,
  WALLET_ADDRESS_CONFLICT_MESSAGE,
} from '../../utils/walletAddressOwnership.constants';

const normalizeProjectUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const urlCandidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(urlCandidate);
    if (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.includes('.')
    ) {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
};

const createTrancheFormSchema = (
  isST: boolean,
  isAgenticEngineering: boolean,
) => {
  return z
    .object({
      walletAddress: z.string().min(1, 'Solana Wallet Address is required'),
      projectUpdate: isAgenticEngineering
        ? z.string().optional()
        : z.string().min(1, 'Project update is required'),
      helpWanted: z.string().optional(),
      eventPictures: isST
        ? z.array(z.string()).min(1, 'At least one event picture is required')
        : z.array(z.string()).optional(),
      eventReceipts: isST
        ? z.array(z.string()).min(1, 'At least one receipt is required')
        : z.array(z.string()).optional(),
      attendeeCount: isST
        ? z.number().min(1, 'Attendee count is required')
        : z.number().optional(),
      socialPost: isST
        ? z.string().min(1, 'Social post link is required')
        : z.string().optional(),
      colosseumLink: isAgenticEngineering
        ? z.string().min(1, 'Colosseum link is required')
        : z.string().optional(),
      githubRepo: isAgenticEngineering
        ? z.string().min(1, 'GitHub repo is required')
        : z.string().optional(),
      aiReceipt: isAgenticEngineering
        ? z
            .array(z.string())
            .min(1, 'AI subscription receipt is required')
            .max(1, 'Only one AI subscription receipt can be uploaded')
        : z.array(z.string()).optional(),
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

      if (isST && data.socialPost) {
        try {
          const url = new URL(data.socialPost);
          if (!url.hostname.includes('.')) {
            throw new Error('Invalid hostname');
          }
        } catch {
          ctx.addIssue({
            code: 'custom',
            path: ['socialPost'],
            message: 'Please enter a valid URL',
          });
        }
      }

      if (
        isAgenticEngineering &&
        data.colosseumLink &&
        !normalizeProjectUrl(data.colosseumLink)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['colosseumLink'],
          message: 'Please enter a valid project URL',
        });
      }

      if (
        isAgenticEngineering &&
        data.githubRepo &&
        !extractGithubRepoPath(data.githubRepo)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['githubRepo'],
          message: 'Please enter a valid GitHub repository URL',
        });
      }
    });
};

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
  const isST = grant.isST === true;
  const isAgenticEngineering = isAgenticEngineeringGrant(grant);
  const trancheCopy = isST
    ? ST_GRANT_COPY.tranche
    : isAgenticEngineering
      ? AGENTIC_ENGINEERING_GRANT_COPY.tranche
      : null;

  const trancheFormSchema = useMemo(
    () => createTrancheFormSchema(isST, isAgenticEngineering),
    [isST, isAgenticEngineering],
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
      colosseumLink: '',
      githubRepo: '',
      aiReceipt: [],
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
        ...(isST && {
          eventPictures: values.eventPictures,
          eventReceipts: values.eventReceipts,
          attendeeCount: values.attendeeCount,
          socialPost: values.socialPost,
        }),
        ...(isAgenticEngineering && {
          colosseumLink: normalizeProjectUrl(values.colosseumLink || ''),
          githubRepo: values.githubRepo,
          aiReceipts: values.aiReceipt,
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
      const serverMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.response?.data?.error
        : undefined;

      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === WALLET_ADDRESS_CONFLICT_CODE
      ) {
        const walletErrorMessage =
          serverMessage || WALLET_ADDRESS_CONFLICT_MESSAGE;
        form.setError('walletAddress', {
          type: 'server',
          message: walletErrorMessage,
        });
        toast.error(walletErrorMessage);
        return;
      }

      toast.error(serverMessage || 'Failed to submit tranche request');
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
        {trancheCopy?.title ?? 'Tranche Request Form'}
        <p className="mt-3 text-sm font-medium text-slate-700">
          {trancheCopy?.subtitle ??
            'Only apply for a tranche if you have made significant progress. Tranches will be split as follows:'}
        </p>
        {trancheCopy?.description ? (
          <p className="mt-2 text-sm font-normal text-slate-500">
            {trancheCopy.description}
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
            {!isAgenticEngineering && (
              <FormFieldWrapper
                control={form.control}
                name="projectUpdate"
                label={
                  trancheCopy?.projectUpdate?.label ??
                  'Share an update about your project'
                }
                description={
                  trancheCopy?.projectUpdate?.description ??
                  'Tell us about the progress you have made on the project so far.'
                }
                isRequired
                isRichEditor
                richEditorPlaceholder={
                  trancheCopy?.projectUpdate?.placeholder ??
                  'Write your project update...'
                }
              />
            )}

            {isST && (
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
                        label={trancheCopy?.eventPictures?.label}
                        description={trancheCopy?.eventPictures?.description}
                        allowLargeFiles
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
                        label={trancheCopy?.eventReceipts?.label}
                        description={trancheCopy?.eventReceipts?.description}
                        allowPdf
                        allowLargeFiles
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
                          {trancheCopy?.attendeeCount?.label}
                        </FormLabel>
                        <FormDescription>
                          {trancheCopy?.attendeeCount?.description}
                        </FormDescription>
                      </div>
                      <div>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder={
                              trancheCopy?.attendeeCount?.placeholder
                            }
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(
                                value ? parseInt(value, 10) : undefined,
                              );
                            }}
                            onKeyDown={(e) => {
                              if (
                                !/^\d$/.test(e.key) &&
                                ![
                                  'Backspace',
                                  'Delete',
                                  'Tab',
                                  'ArrowLeft',
                                  'ArrowRight',
                                  'Home',
                                  'End',
                                ].includes(e.key)
                              ) {
                                e.preventDefault();
                              }
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

            {isAgenticEngineering && (
              <>
                <FormField
                  control={form.control}
                  name="colosseumLink"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <div>
                        <FormLabel isRequired>
                          {trancheCopy?.colosseumLink?.label}
                        </FormLabel>
                        <FormDescription>
                          {trancheCopy?.colosseumLink?.description}
                        </FormDescription>
                      </div>
                      <div>
                        <FormControl>
                          <Input
                            placeholder={
                              trancheCopy?.colosseumLink?.placeholder
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="pt-1" />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="githubRepo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <div>
                        <FormLabel isRequired>
                          {trancheCopy?.githubRepo?.label}
                        </FormLabel>
                        <FormDescription>
                          {trancheCopy?.githubRepo?.description}
                        </FormDescription>
                      </div>
                      <div>
                        <FormControl>
                          <div className="flex h-10 items-center">
                            <div className="flex h-full items-center justify-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-600 shadow-xs md:text-sm">
                              {GITHUB_REPO_LABEL}
                            </div>
                            <Input
                              className="h-full rounded-l-none"
                              placeholder={trancheCopy?.githubRepo?.placeholder}
                              value={getGithubRepoDisplayValue(
                                field.value || '',
                              )}
                              onChange={(e) => {
                                const value = e.currentTarget.value;
                                const path = extractGithubRepoPath(value);
                                field.onChange(
                                  path
                                    ? `${GITHUB_REPO_PREFIX}${path}`
                                    : value
                                      ? `${GITHUB_REPO_PREFIX}${value.replace(/^\/+/, '')}`
                                      : '',
                                );
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="pt-1" />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aiReceipt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <MultiImageUploader
                        source="grant-agentic-receipts"
                        value={(field.value as string[]) || []}
                        onChange={field.onChange}
                        maxImages={3}
                        minImages={1}
                        label={trancheCopy?.aiReceipt?.label}
                        description={trancheCopy?.aiReceipt?.description}
                        allowPdf
                        allowLargeFiles
                      />
                      <FormMessage />
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
                      {trancheCopy?.walletAddress.label ??
                        'Wallet address for receiving this tranche'}
                    </FormLabel>
                    <FormDescription>
                      {trancheCopy?.walletAddress.description ??
                        'This field is pre-filled with the wallet address you last added for this grant project. If you want to receive the grant tranche payment in a new wallet, please update this field.'}
                    </FormDescription>
                  </div>
                  <div>
                    <FormControl>
                      <Input
                        placeholder="Add your Solana wallet address"
                        {...field}
                      />
                    </FormControl>
                    {!isST && !isSameAsEmbeddedWallet && (
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

            {isST && (
              <FormField
                control={form.control}
                name="socialPost"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <div>
                      <FormLabel isRequired>
                        {trancheCopy?.socialPost?.label}
                      </FormLabel>
                      <FormDescription>
                        {trancheCopy?.socialPost?.description}
                      </FormDescription>
                    </div>
                    <div>
                      <FormControl>
                        <div className="flex h-9 items-center">
                          <div className="flex h-full items-center justify-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-600 shadow-xs md:justify-start md:text-sm">
                            https://
                          </div>
                          <Input
                            className="h-full rounded-l-none"
                            placeholder={trancheCopy?.socialPost?.placeholder}
                            value={
                              field.value?.replace(/^https?:\/\//, '') || ''
                            }
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /^https?:\/\//,
                                '',
                              );
                              field.onChange(value ? `https://${value}` : '');
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="pt-1" />
                    </div>
                  </FormItem>
                )}
              />
            )}

            <FormFieldWrapper
              control={form.control}
              name="helpWanted"
              label={trancheCopy?.helpWanted.label ?? 'Any help wanted?'}
              description={
                trancheCopy?.helpWanted.description ??
                "Beyond funding, please detail specific challenges and how our expertise/resources can assist your project's success."
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
          {isST
            ? ST_GRANT_COPY.tranche.terms
            : 'By applying to this tranche request, you agree to our '}
          {!isST && (
            <button
              type="button"
              onClick={() => setIsTOSModalOpen(true)}
              className="cursor-pointer underline underline-offset-2"
              rel="noopener noreferrer"
            >
              Terms of Use
            </button>
          )}
          {!isST && '.'}
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
