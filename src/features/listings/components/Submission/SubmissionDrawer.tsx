import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { X } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { type JSX, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

import { RichEditor } from '@/components/shared/RichEditor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { CreditIcon } from '@/features/credits/icon/credit';
import { SocialInput } from '@/features/social/components/SocialInput';

import { submissionCountQuery } from '../../queries/submission-count';
import { userSubmissionQuery } from '../../queries/user-submission-status';
import { type Listing } from '../../types';
import { submissionSchema } from '../../utils/submissionFormSchema';
import { SubmissionTerms } from './SubmissionTerms';

interface Props {
  id: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  editMode: boolean;
  listing: Listing;
  isTemplate?: boolean;
  isSubmitDisabled: boolean;
  showEasterEgg: () => void;
  onSurveyOpen: () => void;
}

type FormData = z.infer<ReturnType<typeof submissionSchema>>;

export const SubmissionDrawer = ({
  isOpen,
  onClose,
  editMode,
  listing,
  isTemplate = false,
  isSubmitDisabled,
  showEasterEgg,
  onSurveyOpen,
}: Props) => {
  const {
    id,
    type,
    eligibility,
    compensationType,
    token,
    minRewardAsk,
    maxRewardAsk,
    Hackathon,
  } = listing;

  const queryClient = useQueryClient();
  const isProject = type === 'project';
  const isBounty = type === 'bounty';
  const isHackathon = type === 'hackathon';
  const [isLoading, setIsLoading] = useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { user, refetchUser } = useUser();
  const form = useForm<FormData>({
    resolver: zodResolver(
      submissionSchema(listing, minRewardAsk || 0, maxRewardAsk || 0, user),
    ),
    defaultValues: {
      eligibilityAnswers:
        Array.isArray(listing.eligibility) && listing.eligibility.length > 0
          ? listing.eligibility.map((q) => ({
              question: q.question,
              answer: '',
              optional: q.optional,
            }))
          : [],
    },
  });

  const router = useRouter();
  const { query } = router;

  const handleClose = () => {
    form.reset({
      link: '',
      tweet: '',
      otherInfo: '',
      ask: null,
      eligibilityAnswers: Array.isArray(listing.eligibility)
        ? listing.eligibility.map((q) => ({
            question: q.question,
            answer: '',
          }))
        : [],
    });
    setTermsAccepted(false);
    onClose();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (editMode && id) {
        try {
          const response = await api.get('/api/submission/get/', {
            params: { id },
          });

          const { link, tweet, otherInfo, eligibilityAnswers, ask } =
            response.data;

          form.reset({
            link,
            tweet,
            otherInfo,
            ask,
            eligibilityAnswers,
          });
        } catch (error) {
          console.error('Failed to fetch submission data', error);
          toast.error('Failed to load submission data');
        }
      }
    };

    fetchData();
  }, [id, editMode, form.reset]);

  const isDisabled = useMemo(
    () =>
      Boolean(
        isSubmitDisabled ||
          isTemplate ||
          !!query['preview'] ||
          (isHackathon && !editMode && !termsAccepted) ||
          isLoading ||
          form.formState.isSubmitting,
      ),

    [
      isSubmitDisabled,
      isTemplate,
      query,
      isHackathon,
      editMode,
      termsAccepted,
      isLoading,
      form.formState.isSubmitting,
    ],
  );

  const onSubmit = async (data: FormData) => {
    if (isLoading) return;
    if (isDisabled) return;

    posthog.capture('confirmed_submission');
    setIsLoading(true);
    try {
      const submissionEndpoint = editMode
        ? '/api/submission/update/'
        : '/api/submission/create/';

      await api.post(submissionEndpoint, {
        listingId: id,
        link: data.link || '',
        tweet: data.tweet || '',
        otherInfo: data.otherInfo || '',
        ask: data.ask || null,
        eligibilityAnswers: data.eligibilityAnswers || [],
        telegram: data.telegram || user?.telegram || '',
      });

      const latestSubmissionNumber = (user?.Submission?.length ?? 0) + 1;
      if (!editMode) showEasterEgg();
      if (!editMode && latestSubmissionNumber % 3 !== 0) onSurveyOpen();

      form.reset();
      await queryClient.invalidateQueries({
        queryKey: userSubmissionQuery(id!, user!.id).queryKey,
      });

      await refetchUser();

      if (!editMode) {
        await queryClient.invalidateQueries({
          queryKey: submissionCountQuery(id!).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: ['creditBalance', user!.id],
        });
        await queryClient.invalidateQueries({
          queryKey: ['creditHistory', user!.id],
        });
      }

      toast.success(
        editMode
          ? 'Submission updated successfully'
          : 'Submission created successfully',
      );
      handleClose();

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      if (axios.isAxiosError(error)) {
        if (error.status === 401) {
          toast.error(
            'Error occurred during submission. Please re-log in and try again.',
          );
        } else if (
          String(error?.response?.data.error)
            .toLowerCase()
            .includes('submissions closed')
        ) {
          toast.error(
            `Unfortunately, you ${isProject ? 'application' : 'submission'} couldn't be added because the deadline of the listing has passed.`,
          );
        } else {
          toast.error('Failed to submit. Please try again or contact support.');
        }
      } else {
        toast.error('Failed to submit. Please try again or contact support.');
      }
    }
  };

  let headerText = '';
  let subheadingText: JSX.Element | string = '';
  switch (type) {
    case 'project':
      headerText = 'Submit Your Application';
      subheadingText = (
        <>
          <p>
            {`Don't start working on the scope just yet! Apply first. Only the winning candidate will have to work on the scope mentioned in this listing. `}
          </p>
          <p>Note:</p>
          <p>
            1. The sponsor might contact you to assess fit before picking the
            winner.
          </p>
          <p>
            2. You can edit this application until the deadline of this listing.
          </p>
        </>
      );
      break;
    case 'bounty':
      headerText = 'Bounty Submission';
      subheadingText = (
        <>
          <p>{`We can't wait to see what you've created!`}</p>
          <p>Note: You can edit this submission until the bounty deadline.</p>
        </>
      );
      break;
    case 'hackathon':
      headerText = `${Hackathon?.name || ''} Track Submission`;
      subheadingText = (
        <>
          Note:
          <p>
            1. In the “Link to your Submission” field, submit your hackathon
            project’s most useful link (could be a loom video, GitHub link,
            website, etc)
          </p>
          <p>
            2. To be eligible for different tracks, you need to submit to each
            challenge separately
          </p>
          <p>
            3. {`There's no`} restriction on the number of tracks you can submit
            to
          </p>
        </>
      );
      break;
  }

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose}>
      <SideDrawerContent className="px-2 sm:p-4">
        <X
          className="absolute top-10 right-4 z-10 h-4 w-4 text-slate-400 sm:top-8 sm:right-8"
          onClick={handleClose}
        />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ width: '100%', height: '100%' }}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="h-full overflow-y-auto rounded-lg border border-slate-200 px-2 shadow-[0px_1px_3px_rgba(0,0,0,0.08),_0px_1px_2px_rgba(0,0,0,0.06)] md:px-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:w-1.5">
                <div className="mb-4 border-b border-slate-100 bg-white py-3">
                  <p className="text-lg font-medium text-slate-700">
                    {headerText}
                  </p>
                  <p className="text-sm text-slate-500">{subheadingText}</p>
                </div>
                <div>
                  <div className="mb-5 flex flex-col gap-4">
                    {!isProject && (
                      <>
                        <FormField
                          control={form.control}
                          name={'link'}
                          render={({ field }) => (
                            <FormItem className={cn('flex flex-col gap-2')}>
                              <div>
                                <FormLabel isRequired>
                                  Link to Your Submission
                                </FormLabel>
                                <FormDescription>
                                  Make sure this link is accessible by everyone!
                                </FormDescription>
                              </div>
                              <div>
                                <FormControl>
                                  <div className="flex">
                                    <div className="border-input bg-muted flex items-center gap-1 rounded-l-md border border-r-0 px-2 shadow-xs">
                                      <p className="text-sm font-medium text-slate-500">
                                        https://
                                      </p>
                                    </div>
                                    <Input
                                      {...field}
                                      maxLength={500}
                                      placeholder="Add a link"
                                      className="rounded-l-none"
                                      autoComplete="off"
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
                          name={'tweet'}
                          render={({ field }) => (
                            <FormItem className={cn('flex flex-col gap-2')}>
                              <div>
                                <FormLabel>Tweet Link</FormLabel>
                                <FormDescription>
                                  This helps sponsors discover (and maybe
                                  repost) your work on Twitter! If this
                                  submission is for a Twitter thread bounty, you
                                  can ignore this field.
                                </FormDescription>
                              </div>
                              <div>
                                <FormControl>
                                  <div className="flex">
                                    <div className="border-input bg-muted flex items-center gap-1 rounded-l-md border border-r-0 px-2 shadow-xs">
                                      <p className="text-sm font-medium text-slate-500">
                                        https://
                                      </p>
                                    </div>
                                    <Input
                                      {...field}
                                      maxLength={500}
                                      placeholder="Add a tweet's link"
                                      className="rounded-l-none"
                                      autoComplete="off"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="pt-1" />
                              </div>
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    {eligibility?.map((e, index) => {
                      return (
                        <FormField
                          key={e.order}
                          control={form.control}
                          name={`eligibilityAnswers.${index}.answer`}
                          render={({ field }) => (
                            <FormItem className={cn('flex flex-col gap-2')}>
                              <div>
                                <FormLabel isRequired={!e.optional}>
                                  {e.question}
                                </FormLabel>
                              </div>
                              <div>
                                <FormControl>
                                  {e.isLink || e.type === 'link' ? (
                                    <div className="flex">
                                      <div className="border-input bg-muted flex items-center gap-1 rounded-l-md border border-r-0 px-2 shadow-xs">
                                        <p className="text-sm font-medium text-slate-500">
                                          https://
                                        </p>
                                      </div>
                                      <Input
                                        {...field}
                                        placeholder="Add a link..."
                                        className="rounded-l-none"
                                        autoComplete="off"
                                      />
                                    </div>
                                  ) : (
                                    <RichEditor
                                      {...field}
                                      id={`eligibilityAnswers.${index}.answer`}
                                      value={field.value || ''}
                                      error={false}
                                      placeholder={'Write something...'}
                                    />
                                  )}
                                </FormControl>
                                <FormMessage className="pt-1" />
                              </div>
                            </FormItem>
                          )}
                        />
                      );
                    })}
                    {compensationType !== 'fixed' && (
                      <FormFieldWrapper
                        control={form.control}
                        name="ask"
                        label="What's the compensation you require to complete this fully?"
                        isRequired
                        isTokenInput
                        token={token}
                      />
                    )}
                    {isProject && !user?.telegram && !editMode && (
                      <SocialInput
                        name="telegram"
                        socialName={'telegram'}
                        placeholder=""
                        required
                        formLabel="Your Telegram username"
                        control={form.control}
                        height="h-9"
                        showIcon={false}
                      />
                    )}
                    <FormFieldWrapper
                      control={form.control}
                      name="otherInfo"
                      label="Anything Else?"
                      description="If you have any other links or information you'd like to share with us, please add them here!"
                      isRichEditor
                      richEditorPlaceholder="Add info or link"
                    />
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col">
                {isHackathon && !editMode && (
                  <div className="mb-4 flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple mt-1"
                      checked={termsAccepted}
                      onCheckedChange={(checked) =>
                        setTermsAccepted(checked as boolean)
                      }
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-none text-slate-600"
                    >
                      I confirm that I have reviewed the scope of this track and
                      that my submission adheres to the specified requirements.
                      Submitting a project that does not meet the submission
                      requirements, including potential spam, may result in
                      restrictions on future submissions.
                    </label>
                  </div>
                )}

                <Button
                  className="ph-no-capture h-12 w-full"
                  disabled={isDisabled}
                  type="submit"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      <span>{editMode ? 'Updating...' : 'Submitting...'}</span>
                    </>
                  ) : isProject ? (
                    <span className="flex items-center gap-2">
                      {editMode ? 'Update' : 'Apply using 1 credit'}
                      {!editMode && <CreditIcon />}
                    </span>
                  ) : isBounty ? (
                    <span className="flex items-center gap-2">
                      {editMode ? 'Update' : 'Submit using 1 credit'}
                      {!editMode && <CreditIcon />}
                    </span>
                  ) : (
                    <span>{editMode ? 'Update' : 'Submit'}</span>
                  )}
                </Button>
                <p className="mt-2 text-center text-xs text-slate-400 sm:text-sm">
                  By submitting/applying to this listing, you agree to our{' '}
                  <button
                    onClick={() => setIsTOSModalOpen(true)}
                    className="cursor-pointer underline underline-offset-2"
                    rel="noopener noreferrer"
                    type="button"
                  >
                    Terms of Use
                  </button>
                  .
                </p>
              </div>
            </div>
          </form>
        </Form>
        {listing?.sponsor?.name && (
          <SubmissionTerms
            entityName={listing.sponsor.entityName}
            isOpen={isTOSModalOpen}
            onClose={() => setIsTOSModalOpen(false)}
            sponsorName={listing.sponsor.name}
          />
        )}
      </SideDrawerContent>
    </SideDrawer>
  );
};
