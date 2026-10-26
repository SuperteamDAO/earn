'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { posthog } from 'posthog-js';
import { type JSX, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

import { VerifiedXIcon } from '@/components/icons/VerifiedXIcon';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { postJson, RequestError } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';
import type { ViewerEntry } from '@/server/listing-details';
import { cn } from '@/utils/cn';

import { CreditIcon } from '@/features/credits/icon/credit';
import { XVerificationModal } from '@/features/social/components/XVerificationModal';
import { useXVerification } from '@/features/social/hooks/use-x-verification';
import {
  extractXHandle,
  INVALID_X_STATUS_LINK_MESSAGE,
  isHandleVerified,
  isXInternalStatusUrl,
  isXUrl,
} from '@/features/social/utils/x-verification';

import { useChapters } from '../../hooks/useChapters';
import type { Listing, SubmissionMutationResponse } from '../../types';
import { getCombinedRegion } from '../../utils/region';
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
  // The viewer's own entry, to edit.
  submission?: ViewerEntry | null;
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
  submission = null,
}: Props) => {
  const { id, type, eligibility, Hackathon, isFndnPaying, region } = listing;
  const chapters = useChapters();
  const isBounty = type === 'bounty';
  const isHackathon = type === 'hackathon';
  const [isLoading, setIsLoading] = useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kycAcknowledged, setKycAcknowledged] = useState(false);
  const {
    isOpen: isVerificationModalOpen,
    onOpen: onVerificationModalOpen,
    onClose: onVerificationModalClose,
  } = useDisclosure();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'error'
  >('loading');
  const [verificationHandle, setVerificationHandle] = useState<string | null>(
    null,
  );

  const user = useViewer();
  // X accounts verified on Earn, plus any verified in this form.
  const [verifiedHandles, setVerifiedHandles] = useState<string[]>(() =>
    Array.isArray(user?.linkedTwitter)
      ? user.linkedTwitter.filter(
          (handle): handle is string => typeof handle === 'string',
        )
      : [],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(submissionSchema(listing, verifiedHandles)),
    defaultValues: {
      eligibilityAnswers:
        Array.isArray(listing.eligibility) && listing.eligibility.length > 0
          ? listing.eligibility.map((q) => ({
              question: q.question,
              answer: '',
            }))
          : [],
    },
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  // react-hook-form's watch, as Earn's form uses it.
  // oxlint-disable-next-line react/incompatible-library
  const tweetValue = form.watch('tweet');
  const linkValue = form.watch('link');
  const hasInvalidTweetStatusFormat =
    isBounty && !!tweetValue && isXInternalStatusUrl(tweetValue);
  const hasInvalidLinkStatusFormat =
    isBounty && !!linkValue && isXInternalStatusUrl(linkValue);

  const needsXVerification = useMemo(() => {
    if (hasInvalidTweetStatusFormat) {
      return false;
    }

    if (!tweetValue || !isXUrl(tweetValue)) {
      return false;
    }

    const handle = extractXHandle(tweetValue);
    if (!handle) {
      return false;
    }

    return !isHandleVerified(handle, verifiedHandles);
  }, [hasInvalidTweetStatusFormat, tweetValue, verifiedHandles]);

  const needsLinkVerification = useMemo(() => {
    if (hasInvalidLinkStatusFormat) {
      return false;
    }

    if (!linkValue || !isXUrl(linkValue)) {
      return false;
    }

    const handle = extractXHandle(linkValue);
    if (!handle) {
      return false;
    }

    return !isHandleVerified(handle, verifiedHandles);
  }, [hasInvalidLinkStatusFormat, linkValue, verifiedHandles]);

  const isTweetVerified = useMemo(() => {
    if (!tweetValue || !isXUrl(tweetValue)) {
      return false;
    }

    const handle = extractXHandle(tweetValue);
    if (!handle) {
      return false;
    }

    return isHandleVerified(handle, verifiedHandles);
  }, [tweetValue, verifiedHandles]);

  const isLinkVerified = useMemo(() => {
    if (!linkValue || !isXUrl(linkValue)) {
      return false;
    }

    const handle = extractXHandle(linkValue);
    if (!handle) {
      return false;
    }

    return isHandleVerified(handle, verifiedHandles);
  }, [linkValue, verifiedHandles]);

  const regionAckCopy = useMemo(() => {
    if (!region || region === 'Global') {
      return `I acknowledge that if I win, I will have to complete KYC verification to receive my prize money.`;
    }
    const regionObject = getCombinedRegion(region, false, chapters);
    const regionDisplayName =
      regionObject?.displayValue || regionObject?.name || region;
    return `I acknowledge that if I win, I will have to complete KYC verification that proves I am from ${regionDisplayName}`;
  }, [chapters, region]);

  useEffect(() => {
    if (hasInvalidTweetStatusFormat) {
      form.setError('tweet', {
        type: 'manual',
        message: INVALID_X_STATUS_LINK_MESSAGE,
      });
    } else if (needsXVerification) {
      form.setError('tweet', {
        type: 'manual',
        message: 'We need to verify that you own this X account',
      });
    } else {
      form.clearErrors('tweet');
    }

    if (hasInvalidLinkStatusFormat) {
      form.setError('link', {
        type: 'manual',
        message: INVALID_X_STATUS_LINK_MESSAGE,
      });
    } else if (needsLinkVerification) {
      form.setError('link', {
        type: 'manual',
        message: 'We need to verify that you own this X account',
      });
    } else {
      form.clearErrors('link');
    }
  }, [
    hasInvalidTweetStatusFormat,
    hasInvalidLinkStatusFormat,
    needsXVerification,
    needsLinkVerification,
    form,
  ]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    form.reset({
      link: '',
      tweet: '',
      otherInfo: '',
      eligibilityAnswers: Array.isArray(listing.eligibility)
        ? listing.eligibility.map((q) => ({
            question: q.question,
            answer: '',
          }))
        : [],
    });
    setTermsAccepted(false);
    setKycAcknowledged(false);
    onClose();
  };

  const savedForm = submission?.form;
  useEffect(() => {
    if (editMode && id && savedForm) {
      const { link, tweet, otherInfo, eligibilityAnswers } = savedForm;
      const reconciledAnswers =
        Array.isArray(listing.eligibility) && listing.eligibility.length > 0
          ? listing.eligibility.map((currentQuestion, index) => {
              const savedAnswersArray = Array.isArray(eligibilityAnswers)
                ? eligibilityAnswers.filter(
                    (
                      saved: unknown,
                    ): saved is { question: string; answer: string } =>
                      typeof saved === 'object' &&
                      saved !== null &&
                      'question' in saved &&
                      'answer' in saved,
                  )
                : [];

              const matchByText = savedAnswersArray.find(
                (saved) => saved.question === currentQuestion.question,
              );

              if (matchByText) {
                return {
                  question: currentQuestion.question,
                  answer: matchByText.answer || '',
                };
              }

              const matchByIndex = savedAnswersArray[index];
              if (matchByIndex?.answer) {
                return {
                  question: currentQuestion.question,
                  answer: matchByIndex.answer,
                };
              }

              return {
                question: currentQuestion.question,
                answer: '',
              };
            })
          : [];

      form.reset({
        link,
        tweet,
        otherInfo,
        eligibilityAnswers: reconciledAnswers,
      });
    }
  }, [id, editMode, form, listing.eligibility, savedForm]);

  const isDisabled = useMemo(
    () =>
      isSubmitDisabled ||
      isTemplate ||
      !!searchParams?.get('preview') ||
      (isHackathon && !editMode && !termsAccepted) ||
      (isFndnPaying && !editMode && !kycAcknowledged) ||
      isLoading ||
      form.formState.isSubmitting ||
      hasInvalidTweetStatusFormat ||
      hasInvalidLinkStatusFormat ||
      needsXVerification ||
      needsLinkVerification,

    [
      isSubmitDisabled,
      isTemplate,
      searchParams,
      isHackathon,
      editMode,
      termsAccepted,
      isFndnPaying,
      kycAcknowledged,
      isLoading,
      form.formState.isSubmitting,
      hasInvalidTweetStatusFormat,
      hasInvalidLinkStatusFormat,
      needsXVerification,
      needsLinkVerification,
    ],
  );

  const { verify: verifyX } = useXVerification();

  const { manualSync } = useServerTimeSync();

  const handleVerifyClick = async (fieldName: 'tweet' | 'link') => {
    const fieldValue = fieldName === 'tweet' ? tweetValue : linkValue;
    if (!fieldValue) return;

    const handle = extractXHandle(fieldValue);
    if (!handle) return;

    try {
      setVerificationStatus('loading');
      setVerificationHandle(handle);
      onVerificationModalOpen();

      // Opens X in a popup; the page refreshes with the account linked.
      const result = await verifyX();
      const verifiedHandle = result.handle;
      if (
        result.verified &&
        verifiedHandle &&
        isHandleVerified(handle, [verifiedHandle])
      ) {
        setVerifiedHandles((handles) => [...handles, verifiedHandle]);
        setTimeout(() => void form.trigger(fieldName), 0);
        setVerificationHandle(null);
        onVerificationModalClose();
      } else {
        setVerificationStatus('error');
      }
    } catch (error) {
      console.error('X verification failed:', error);
      setVerificationStatus('error');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (isLoading) return;
    if (isDisabled) return;

    posthog.capture('confirmed_submission');
    setIsLoading(true);
    try {
      await manualSync();
    } catch {}
    try {
      const submissionEndpoint = editMode
        ? '/api/submission/update/'
        : '/api/submission/create/';

      await postJson<SubmissionMutationResponse>(submissionEndpoint, {
        listingId: id,
        link: data.link || '',
        tweet: data.tweet || '',
        otherInfo: data.otherInfo || '',
        eligibilityAnswers: data.eligibilityAnswers || [],
      });

      form.reset();
      // The page loads the entry, counts and credits again.
      router.refresh();

      if (!editMode) showEasterEgg();

      toast.success(
        editMode
          ? 'Submission updated successfully'
          : 'Submission created successfully',
      );
      handleClose();

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof RequestError) {
        const body: unknown = error.body;
        if (error.status === 401) {
          toast.error(
            'Error occurred during submission. Please re-log in and try again.',
          );
        } else if (
          String(
            typeof body === 'object' && body !== null && 'error' in body
              ? body.error
              : '',
          )
            .toLowerCase()
            .includes('submissions closed')
        ) {
          toast.error(
            `Unfortunately, your submission couldn't be added because the deadline of the listing has passed.`,
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
            1. In the &quot;Link to your Submission&quot; field, submit your
            hackathon project&apos;s most useful link (could be a loom video,
            GitHub link, website, etc)
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
      <SideDrawerContent className="w-screen max-w-2xl px-2 sm:p-4">
        <X
          className="absolute top-10 right-4 z-10 h-4 w-4 text-slate-400 sm:top-8 sm:right-8"
          onClick={handleClose}
        />
        <Form {...form}>
          <form
            onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
            style={{ width: '100%', height: '100%' }}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <ScrollArea className="h-full overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 px-2 shadow-[0px_1px_3px_rgba(0,0,0,0.08),_0px_1px_2px_rgba(0,0,0,0.06)]">
                <div className="mb-4 border-b border-slate-100 bg-white py-3">
                  <p className="text-lg font-medium text-slate-700">
                    {headerText}
                  </p>
                  <p className="text-sm text-slate-500">{subheadingText}</p>
                </div>
                <div>
                  <div className="mb-5 flex flex-col gap-4">
                    {
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
                                  <div className="mr-0.5 flex">
                                    <div className="border-input bg-muted flex items-center gap-1 rounded-l-md border border-r-0 px-2 shadow-xs">
                                      <p className="text-sm font-medium text-slate-500">
                                        https://
                                      </p>
                                    </div>
                                    <div className="relative flex-1">
                                      <Input
                                        {...field}
                                        maxLength={500}
                                        placeholder="Add a link"
                                        className={cn(
                                          'rounded-l-none',
                                          (needsLinkVerification ||
                                            isLinkVerified) &&
                                            'pr-10',
                                        )}
                                        autoComplete="off"
                                      />
                                      {needsLinkVerification && (
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            void handleVerifyClick('link')
                                          }
                                          size="sm"
                                          className={cn(
                                            'absolute top-1/2 right-1 h-7 -translate-y-1/2 px-3 text-xs',
                                          )}
                                        >
                                          Verify
                                        </Button>
                                      )}
                                      {isLinkVerified && <VerifiedXIcon />}
                                    </div>
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
                                  repost) your work on X! If this submission is
                                  for a X thread bounty, you can ignore this
                                  field.
                                </FormDescription>
                              </div>
                              <div>
                                <FormControl>
                                  <div className="mr-0.5 flex">
                                    <div className="border-input bg-muted flex items-center gap-1 rounded-l-md border border-r-0 px-2 shadow-xs">
                                      <p className="text-sm font-medium text-slate-500">
                                        https://
                                      </p>
                                    </div>
                                    <div className="relative flex-1">
                                      <Input
                                        {...field}
                                        maxLength={500}
                                        placeholder="Add a tweet's link"
                                        className={cn(
                                          'rounded-l-none',
                                          (needsXVerification ||
                                            isTweetVerified) &&
                                            'pr-10',
                                        )}
                                        autoComplete="off"
                                      />
                                      {needsXVerification && (
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            void handleVerifyClick('tweet')
                                          }
                                          size="sm"
                                          className={cn(
                                            'absolute top-1/2 right-1 h-7 -translate-y-1/2 px-3 text-xs',
                                          )}
                                        >
                                          Verify
                                        </Button>
                                      )}
                                      {isTweetVerified && <VerifiedXIcon />}
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage className="pt-1" />
                              </div>
                            </FormItem>
                          )}
                        />
                      </>
                    }
                    {eligibility?.map((e, index) => {
                      return (
                        <FormField
                          key={e.order}
                          control={form.control}
                          name={`eligibilityAnswers.${index}.answer`}
                          render={({ field }) => (
                            <FormItem className={cn('flex flex-col gap-2')}>
                              <div className="min-w-0">
                                <FormLabel
                                  isRequired={!e.optional}
                                  className="[overflow-wrap:anywhere]"
                                >
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
                                        className={cn('rounded-l-none')}
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
              </ScrollArea>

              <div className="flex w-full flex-col">
                {isHackathon && !editMode && (
                  <div className="mb-4 flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      className={cn(
                        'data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple mt-1',
                      )}
                      checked={termsAccepted}
                      onCheckedChange={(checked) =>
                        setTermsAccepted(checked === true)
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

                {isFndnPaying && !editMode && (
                  <div className="mb-4 flex items-center space-x-3">
                    <Checkbox
                      id="kyc-acknowledgement"
                      className={cn(
                        'data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple',
                      )}
                      checked={kycAcknowledged}
                      onCheckedChange={(checked) =>
                        setKycAcknowledged(checked === true)
                      }
                    />
                    <label
                      htmlFor="kyc-acknowledgement"
                      className="text-sm leading-4 text-slate-600"
                    >
                      {regionAckCopy}
                    </label>
                  </div>
                )}

                <div className="relative w-full">
                  <Button
                    className={cn(
                      'ph-no-capture h-11 w-full gap-4',
                      'disabled:cursor-default disabled:opacity-70',
                      'bg-brand-purple',
                      editMode &&
                        'border-brand-purple hover:text-brand-purple-dark text-white',
                    )}
                    disabled={isDisabled}
                    type="submit"
                    variant={editMode ? 'outline' : 'default'}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>
                          {editMode ? 'Updating...' : 'Submitting...'}
                        </span>
                      </>
                    ) : isBounty ? (
                      <span className="flex items-center gap-2">
                        {editMode ? 'Update' : 'Submit using 1 credit'}
                        {!editMode && <CreditIcon className="ml-1 size-6" />}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {editMode ? 'Update' : 'Submit'}
                      </span>
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-center text-xs text-slate-400 sm:text-sm">
                  By submitting/applying to this listing, you agree to our{' '}
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
        <XVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setVerificationHandle(null);
            onVerificationModalClose();
          }}
          status={verificationStatus}
          handle={verificationHandle}
        />
      </SideDrawerContent>
    </SideDrawer>
  );
};
