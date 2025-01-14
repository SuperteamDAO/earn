import { zodResolver } from '@hookform/resolvers/zod';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

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
  } = listing;

  const queryClient = useQueryClient();
  const isProject = type === 'project';
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
            }))
          : [],
    },
  });
  const posthog = usePostHog();
  const router = useRouter();
  const { query } = router;

  const { connected, publicKey } = useWallet();

  useEffect(() => {
    console.log(window.phantom.solana);
    if (connected && publicKey) {
      form.setValue('publicKey', publicKey.toString());
    }
    console.log(connected);
    console.log(publicKey);
  }, []);

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

  const onSubmit = async (data: FormData) => {
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
        publicKey: data.publicKey,
      });

      const hideEasterEggFromSponsorIds = [
        '53cbd2eb-14e5-4b8a-b6fe-e18e0c885145', // network schoool
      ];

      const latestSubmissionNumber = (user?.Submission?.length ?? 0) + 1;
      if (
        !editMode &&
        latestSubmissionNumber === 1 &&
        !hideEasterEggFromSponsorIds.includes(listing.sponsorId || '')
      )
        showEasterEgg();
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
      }

      toast.success(
        editMode
          ? 'Submission updated successfully'
          : 'Submission created successfully',
      );
      onClose();
    } catch (e) {
      toast.error('Failed to submit. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  let headerText = '';
  let subheadingText: JSX.Element | string = '';
  switch (type) {
    case 'project':
      headerText = 'Submit Your Application';
      subheadingText = (
        <>
          Don&apos;t start working just yet! Apply first, and then begin working
          only once you&apos;ve been hired for the project by the sponsor.
          <p>
            Please note that the sponsor might contact you to assess fit before
            picking the winner.
          </p>
        </>
      );
      break;
    case 'bounty':
      headerText = 'Bounty Submission';
      subheadingText = "We can't wait to see what you've created!";
      break;
    case 'hackathon':
      headerText = 'Solana Radar Track Submission';
      subheadingText = (
        <>
          Note:
          <p>
            1. In the “Link to your Submission” field, submit your hackathon
            project’s most useful link (could be a loom video, GitHub link,
            website, etc)
          </p>
          <p>
            2. To be eligible for different challenges, you need to submit to
            each challenge separately
          </p>
          <p>
            3. {`There's no`} restriction on the number of challenges you can
            submit to
          </p>
        </>
      );
      break;
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(window.phantom.solana);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(window.phantom.solana.publicKey);
    }
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        showCloseIcon={false}
        className="h-full w-full max-w-2xl px-2 sm:max-w-2xl sm:p-4"
      >
        <X
          className="absolute right-4 top-10 z-10 h-4 w-4 text-slate-400 sm:right-8 sm:top-8"
          onClick={onClose}
        />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ width: '100%', height: '100%' }}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="h-full overflow-y-auto rounded-lg border border-slate-200 px-2 shadow-[0px_1px_3px_rgba(0,0,0,0.08),_0px_1px_2px_rgba(0,0,0,0.06)] md:px-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:w-1.5 [&::-webkit-scrollbar]:w-1">
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
                        <FormFieldWrapper
                          control={form.control}
                          name="link"
                          label="Link to Your Submission"
                          description="Make sure this link is accessible by everyone!"
                          isRequired
                        >
                          <Input maxLength={500} placeholder="Add a link" />
                        </FormFieldWrapper>
                        <FormFieldWrapper
                          control={form.control}
                          name="tweet"
                          label="Tweet Link"
                          description="This helps sponsors discover (and maybe repost) your work on Twitter! If this submission is for a Twitter thread bounty, you can ignore this field."
                        >
                          <div className="flex">
                            <div className="flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted px-2 shadow-sm">
                              <p className="text-sm font-medium text-slate-500">
                                https://
                              </p>
                            </div>
                            <Input
                              maxLength={500}
                              placeholder="Add a tweet's link"
                              className="rounded-l-none"
                            />
                          </div>
                        </FormFieldWrapper>
                      </>
                    )}
                    {eligibility?.map((e, index) => (
                      <FormFieldWrapper
                        control={form.control}
                        name={`eligibilityAnswers.${index}.answer`}
                        label={e.question}
                        isRequired
                        isRichEditor={!e.isLink && e.type !== 'link'}
                        key={e.order}
                      >
                        {e.isLink ||
                          (e.type === 'link' && (
                            <div className="flex">
                              <div className="flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted px-2 shadow-sm">
                                <p className="text-sm font-medium text-slate-500">
                                  https://
                                </p>
                              </div>
                              <Input
                                placeholder="Write something..."
                                className="rounded-l-none"
                              />
                            </div>
                          ))}
                      </FormFieldWrapper>
                    ))}
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
                    <FormFieldWrapper
                      control={form.control}
                      name="otherInfo"
                      label="Anything Else?"
                      description="If you have any other links or information you'd like to share with us, please add them here!"
                      isRichEditor
                      richEditorPlaceholder="Add info or link"
                    />
                    <FormField
                      control={form.control}
                      name="publicKey"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col gap-2">
                          <div>
                            <FormLabel isRequired={!user?.publicKey}>
                              Your Solana Wallet Address
                            </FormLabel>
                            <FormDescription>
                              {!!user?.publicKey ? (
                                <span>
                                  This is where you will receive your rewards if
                                  you win. If you don&apos;t have a wallet,{' '}
                                  <span
                                    onClick={() => {
                                      window.phantom.solana.connect();
                                    }}
                                    className="cursor-pointer text-blue-600 underline hover:text-blue-700"
                                  >
                                    Generate one
                                  </span>
                                </span>
                              ) : (
                                <>
                                  This wallet address will be linked to your
                                  profile and you will receive your rewards here
                                  if you win.
                                </>
                              )}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Input
                              className={cn(
                                !!user?.publicKey &&
                                  'cursor-not-allowed text-slate-600 opacity-80',
                              )}
                              placeholder="Add your Solana wallet address"
                              readOnly={!!user?.publicKey}
                              {...(!!user?.publicKey ? {} : field)}
                              value={user?.publicKey || field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col">
                {isHackathon && !editMode && (
                  <div className="mb-4 flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      className="mt-1 data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
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
                  disabled={
                    isTemplate ||
                    (!listing.isPublished && !!query['preview']) ||
                    (isHackathon && !editMode && !termsAccepted)
                  }
                  type="submit"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Submitting...
                    </>
                  ) : isProject ? (
                    'Apply'
                  ) : (
                    'Submit'
                  )}
                </Button>
                <p className="mt-2 text-center text-xs text-slate-400 sm:text-sm">
                  By submitting/applying to this listing, you agree to our{' '}
                  <button
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
      </SheetContent>
    </Sheet>
  );
};
