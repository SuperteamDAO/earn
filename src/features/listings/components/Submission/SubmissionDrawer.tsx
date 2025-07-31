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
import { ScrollArea } from '@/components/ui/scroll-area';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useDisclosure } from '@/hooks/use-disclosure';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { usePopupAuth } from '@/features/auth/hooks/use-popup-auth';
import { CreditIcon } from '@/features/credits/icon/credit';
import { SocialInput } from '@/features/social/components/SocialInput';
import { TwitterVerificationModal } from '@/features/social/components/TwitterVerificationModal';
import {
  extractTwitterHandle,
  isHandleVerified,
  isTwitterUrl,
} from '@/features/social/utils/twitter-verification';

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
  const {
    isOpen: isVerificationModalOpen,
    onOpen: onVerificationModalOpen,
    onClose: onVerificationModalClose,
  } = useDisclosure();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'error'
  >('loading');

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

  const tweetValue = form.watch('tweet');
  const linkValue = form.watch('link');

  const needsTwitterVerification = useMemo(() => {
    if (!tweetValue || !isTwitterUrl(tweetValue)) {
      return false;
    }

    const handle = extractTwitterHandle(tweetValue);
    if (!handle) {
      return false;
    }

    const verifiedHandles = user?.linkedTwitter || [];
    return !isHandleVerified(handle, verifiedHandles);
  }, [tweetValue, user?.linkedTwitter]);

  const needsLinkVerification = useMemo(() => {
    if (!linkValue || !isTwitterUrl(linkValue)) {
      return false;
    }

    const handle = extractTwitterHandle(linkValue);
    if (!handle) {
      return false;
    }

    const verifiedHandles = user?.linkedTwitter || [];
    return !isHandleVerified(handle, verifiedHandles);
  }, [linkValue, user?.linkedTwitter]);

  const isTweetVerified = useMemo(() => {
    if (!tweetValue || !isTwitterUrl(tweetValue)) {
      return false;
    }

    const handle = extractTwitterHandle(tweetValue);
    if (!handle) {
      return false;
    }

    const verifiedHandles = user?.linkedTwitter || [];
    return isHandleVerified(handle, verifiedHandles);
  }, [tweetValue, user?.linkedTwitter]);

  const isLinkVerified = useMemo(() => {
    if (!linkValue || !isTwitterUrl(linkValue)) {
      return false;
    }

    const handle = extractTwitterHandle(linkValue);
    if (!handle) {
      return false;
    }

    const verifiedHandles = user?.linkedTwitter || [];
    return isHandleVerified(handle, verifiedHandles);
  }, [linkValue, user?.linkedTwitter]);

  useEffect(() => {
    if (needsTwitterVerification) {
      form.setError('tweet', {
        type: 'manual',
        message: 'We need to verify that you own this Twitter account',
      });
    } else {
      form.clearErrors('tweet');
    }

    if (needsLinkVerification) {
      form.setError('link', {
        type: 'manual',
        message: 'We need to verify that you own this Twitter account',
      });
    } else {
      form.clearErrors('link');
    }
  }, [needsTwitterVerification, needsLinkVerification, form]);

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
          form.formState.isSubmitting ||
          needsTwitterVerification ||
          needsLinkVerification,
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
      needsTwitterVerification,
      needsLinkVerification,
    ],
  );

  const { signIn: popupSignIn } = usePopupAuth();

  const handleVerifyClick = async (fieldName: 'tweet' | 'link') => {
    const fieldValue = fieldName === 'tweet' ? tweetValue : linkValue;
    if (!fieldValue) return;

    const handle = extractTwitterHandle(fieldValue);
    if (!handle) return;

    try {
      setVerificationStatus('loading');
      onVerificationModalOpen();

      const success = await popupSignIn('twitter');

      if (success) {
        let attempts = 0;
        const maxAttempts = 10;
        const pollForUpdate = async (): Promise<boolean> => {
          const { data: freshUser } = await refetchUser();

          const currentVerifiedHandles = freshUser?.linkedTwitter || [];
          const isNowVerified = isHandleVerified(
            handle,
            currentVerifiedHandles,
          );

          if (isNowVerified) {
            form.trigger(fieldName);
            onVerificationModalClose();
            return true;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            setVerificationStatus('error');
            return false;
          }

          const delay = Math.min(500 * Math.pow(2, attempts - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return pollForUpdate();
        };

        await pollForUpdate();
      } else {
        setVerificationStatus('error');
      }
    } catch (error: any) {
      console.error('Twitter verification failed:', error);
      setVerificationStatus('error');
    }
  };

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
              <ScrollArea className="h-full overflow-y-auto rounded-lg border border-slate-200 px-2 shadow-[0px_1px_3px_rgba(0,0,0,0.08),_0px_1px_2px_rgba(0,0,0,0.06)]">
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
                                            handleVerifyClick('link')
                                          }
                                          size="sm"
                                          className="absolute top-1/2 right-1 h-7 -translate-y-1/2 px-3 text-xs"
                                        >
                                          Verify
                                        </Button>
                                      )}
                                      {isLinkVerified && (
                                        <div className="absolute top-1/2 right-2 -translate-y-1/2">
                                          <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M3.84922 8.6201L4.38398 9.4651L4.97773 9.08934L4.82545 8.40337L3.84922 8.6201ZM8.62922 3.8501L8.41045 4.82587L9.09422 4.97918L9.47172 4.38879L8.62922 3.8501ZM11.9992 2.00488V3.00488V2.00488ZM15.3692 3.8501L14.5267 4.38879L14.9044 4.97955L15.5886 4.82574L15.3692 3.8501ZM20.1492 8.6301L19.1736 8.41074L19.0198 9.09486L19.6105 9.4726L20.1492 8.6301ZM20.1492 15.3701L19.6105 14.5276L19.0201 14.9051L19.1734 15.5889L20.1492 15.3701ZM15.3792 20.1501L15.5959 19.1739L14.9117 19.022L14.5355 19.6134L15.3792 20.1501ZM8.62922 20.1501L9.47297 19.6134L9.09592 19.0206L8.41045 19.1743L8.62922 20.1501ZM3.84922 15.3801L4.82545 15.5968L4.97773 14.9109L4.38398 14.5351L3.84922 15.3801ZM1.98828 12.0001H2.98828H1.98828ZM3.84922 8.6201L4.82545 8.40337C4.71598 7.91027 4.73279 7.39751 4.87432 6.91263L3.91437 6.63244L2.95443 6.35224C2.71855 7.16037 2.69053 8.01498 2.87298 8.83682L3.84922 8.6201ZM3.91437 6.63244L4.87432 6.91263C5.01585 6.42775 5.27751 5.98646 5.63505 5.62967L4.92868 4.92182L4.22232 4.21397C3.62642 4.80863 3.19031 5.54412 2.95443 6.35224L3.91437 6.63244ZM4.92868 4.92182L5.63505 5.62967C5.99259 5.27287 6.43443 5.01213 6.9196 4.87162L6.64142 3.91109L6.36324 2.95056C5.55462 3.18475 4.81822 3.61932 4.22232 4.21397L4.92868 4.92182ZM6.64142 3.91109L6.9196 4.87162C7.40478 4.73111 7.91757 4.71537 8.41045 4.82587L8.62922 3.8501L8.84798 2.87432C8.02652 2.69015 7.17186 2.71638 6.36324 2.95056L6.64142 3.91109ZM8.62922 3.8501L9.47172 4.38879C9.743 3.96452 10.1167 3.61536 10.5584 3.37351L10.0782 2.49638L9.5979 1.61926C8.86172 2.02235 8.23885 2.60428 7.78672 3.3114L8.62922 3.8501ZM10.0782 2.49638L10.5584 3.37351C11.0001 3.13165 11.4956 3.00488 11.9992 3.00488V2.00488V1.00488C11.1599 1.00488 10.3341 1.21617 9.5979 1.61926L10.0782 2.49638ZM11.9992 2.00488V3.00488C12.5028 3.00488 12.9983 3.13165 13.44 3.37351L13.9203 2.49638L14.4005 1.61926C13.6643 1.21617 12.8385 1.00488 11.9992 1.00488V2.00488ZM13.9203 2.49638L13.44 3.37351C13.8817 3.61536 14.2554 3.96452 14.5267 4.38879L15.3692 3.8501L16.2117 3.3114C15.7596 2.60428 15.1367 2.02235 14.4005 1.61926L13.9203 2.49638ZM15.3692 3.8501L15.5886 4.82574C16.0822 4.71476 16.5959 4.73042 17.0818 4.87128L17.3602 3.91081L17.6386 2.95034C16.8287 2.71559 15.9726 2.68948 15.1499 2.87445L15.3692 3.8501ZM17.3602 3.91081L17.0818 4.87128C17.5678 5.01213 18.0102 5.2736 18.368 5.63136L19.0751 4.92425L19.7822 4.21714C19.1859 3.62088 18.4485 3.1851 17.6386 2.95034L17.3602 3.91081ZM19.0751 4.92425L18.368 5.63136C18.7257 5.98912 18.9872 6.43155 19.128 6.91749L20.0885 6.6391L21.049 6.3607C20.8142 5.55079 20.3784 4.81341 19.7822 4.21714L19.0751 4.92425ZM20.0885 6.6391L19.128 6.91749C19.2689 7.40344 19.2846 7.91712 19.1736 8.41074L20.1492 8.6301L21.1249 8.84945C21.3098 8.02674 21.2837 7.17062 21.049 6.3607L20.0885 6.6391ZM20.1492 8.6301L19.6105 9.4726C20.0348 9.74388 20.3839 10.1176 20.6258 10.5593L21.5029 10.079L22.3801 9.59879C21.977 8.8626 21.395 8.23973 20.6879 7.7876L20.1492 8.6301ZM21.5029 10.079L20.6258 10.5593C20.8677 11.001 20.9944 11.4965 20.9944 12.0001H21.9944H22.9944C22.9944 11.1608 22.7831 10.335 22.3801 9.59879L21.5029 10.079ZM21.9944 12.0001H20.9944C20.9944 12.5037 20.8677 12.9992 20.6258 13.4409L21.5029 13.9211L22.3801 14.4014C22.7831 13.6652 22.9944 12.8394 22.9944 12.0001H21.9944ZM21.5029 13.9211L20.6258 13.4409C20.3839 13.8826 20.0348 14.2563 19.6105 14.5276L20.1492 15.3701L20.6879 16.2126C21.395 15.7605 21.977 15.1376 22.3801 14.4014L21.5029 13.9211ZM20.1492 15.3701L19.1734 15.5889C19.2839 16.0817 19.2682 16.5945 19.1277 17.0797L20.0882 17.3579L21.0488 17.6361C21.2829 16.8274 21.3092 15.9728 21.125 15.1513L20.1492 15.3701ZM20.0882 17.3579L19.1277 17.0797C18.9872 17.5649 18.7264 18.0067 18.3696 18.3643L19.0775 19.0706L19.7853 19.777C20.38 19.1811 20.8146 18.4447 21.0488 17.6361L20.0882 17.3579ZM19.0775 19.0706L18.3696 18.3643C18.0129 18.7218 17.5716 18.9835 17.0867 19.125L17.3669 20.0849L17.6471 21.0449C18.4552 20.809 19.1907 20.3729 19.7853 19.777L19.0775 19.0706ZM17.3669 20.0849L17.0867 19.125C16.6018 19.2665 16.089 19.2833 15.5959 19.1739L15.3792 20.1501L15.1625 21.1263C15.9843 21.3088 16.8389 21.2808 17.6471 21.0449L17.3669 20.0849ZM15.3792 20.1501L14.5355 19.6134C14.2645 20.0393 13.8905 20.3899 13.4481 20.6329L13.9293 21.5094L14.4106 22.386C15.1481 21.9811 15.7714 21.3967 16.223 20.6868L15.3792 20.1501ZM13.9293 21.5094L13.4481 20.6329C13.0056 20.8758 12.509 21.0032 12.0042 21.0032V22.0032V23.0032C12.8455 23.0032 13.6732 22.7909 14.4106 22.386L13.9293 21.5094ZM12.0042 22.0032V21.0032C11.4994 21.0032 11.0028 20.8758 10.5604 20.6329L10.0791 21.5094L9.59781 22.386C10.3352 22.7909 11.1629 23.0032 12.0042 23.0032V22.0032ZM10.0791 21.5094L10.5604 20.6329C10.1179 20.3899 9.7439 20.0393 9.47297 19.6134L8.62922 20.1501L7.78547 20.6868C8.23701 21.3967 8.86037 21.9811 9.59781 22.386L10.0791 21.5094ZM8.62922 20.1501L8.41045 19.1743C7.91757 19.2848 7.40478 19.2691 6.9196 19.1286L6.64142 20.0891L6.36324 21.0496C7.17186 21.2838 8.02653 21.31 8.84798 21.1259L8.62922 20.1501ZM6.64142 20.0891L6.9196 19.1286C6.43443 18.9881 5.99259 18.7273 5.63505 18.3705L4.92868 19.0784L4.22232 19.7862C4.81822 20.3809 5.55462 20.8154 6.36324 21.0496L6.64142 20.0891ZM4.92868 19.0784L5.63505 18.3705C5.27751 18.0137 5.01585 17.5724 4.87432 17.0876L3.91437 17.3678L2.95443 17.648C3.19031 18.4561 3.62642 19.1916 4.22232 19.7862L4.92868 19.0784ZM3.91437 17.3678L4.87432 17.0876C4.73279 16.6027 4.71598 16.0899 4.82545 15.5968L3.84922 15.3801L2.87298 15.1634C2.69053 15.9852 2.71855 16.8398 2.95443 17.648L3.91437 17.3678ZM3.84922 15.3801L4.38398 14.5351C3.95645 14.2645 3.60429 13.8902 3.36027 13.447L2.48426 13.9293L1.60826 14.4116C2.01497 15.1503 2.6019 15.7742 3.31445 16.2251L3.84922 15.3801ZM2.48426 13.9293L3.36027 13.447C3.11624 13.0038 2.98828 12.5061 2.98828 12.0001H1.98828H0.988281C0.988281 12.8434 1.20155 13.6729 1.60826 14.4116L2.48426 13.9293ZM1.98828 12.0001H2.98828C2.98828 11.4941 3.11624 10.9964 3.36027 10.5532L2.48426 10.0709L1.60826 9.58858C1.20155 10.3273 0.988281 11.1568 0.988281 12.0001H1.98828ZM2.48426 10.0709L3.36027 10.5532C3.60429 10.11 3.95645 9.73566 4.38398 9.4651L3.84922 8.6201L3.31445 7.7751C2.6019 8.22604 2.01497 8.84988 1.60826 9.58858L2.48426 10.0709Z"
                                              fill="#16A34A"
                                            />
                                            <path
                                              d="M9 12L11 14L15 10"
                                              stroke="#16A34A"
                                              strokeWidth="2"
                                              strokeLinecap="square"
                                            />
                                          </svg>
                                        </div>
                                      )}
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
                                  repost) your work on Twitter! If this
                                  submission is for a Twitter thread bounty, you
                                  can ignore this field.
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
                                          (needsTwitterVerification ||
                                            isTweetVerified) &&
                                            'pr-10',
                                        )}
                                        autoComplete="off"
                                      />
                                      {needsTwitterVerification && (
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            handleVerifyClick('tweet')
                                          }
                                          size="sm"
                                          className="absolute top-1/2 right-1 h-7 -translate-y-1/2 px-3 text-xs"
                                        >
                                          Verify
                                        </Button>
                                      )}
                                      {isTweetVerified && (
                                        <div className="absolute top-1/2 right-2 -translate-y-1/2">
                                          <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M3.84922 8.6201L4.38398 9.4651L4.97773 9.08934L4.82545 8.40337L3.84922 8.6201ZM8.62922 3.8501L8.41045 4.82587L9.09422 4.97918L9.47172 4.38879L8.62922 3.8501ZM11.9992 2.00488V3.00488V2.00488ZM15.3692 3.8501L14.5267 4.38879L14.9044 4.97955L15.5886 4.82574L15.3692 3.8501ZM20.1492 8.6301L19.1736 8.41074L19.0198 9.09486L19.6105 9.4726L20.1492 8.6301ZM20.1492 15.3701L19.6105 14.5276L19.0201 14.9051L19.1734 15.5889L20.1492 15.3701ZM15.3792 20.1501L15.5959 19.1739L14.9117 19.022L14.5355 19.6134L15.3792 20.1501ZM8.62922 20.1501L9.47297 19.6134L9.09592 19.0206L8.41045 19.1743L8.62922 20.1501ZM3.84922 15.3801L4.82545 15.5968L4.97773 14.9109L4.38398 14.5351L3.84922 15.3801ZM1.98828 12.0001H2.98828H1.98828ZM3.84922 8.6201L4.82545 8.40337C4.71598 7.91027 4.73279 7.39751 4.87432 6.91263L3.91437 6.63244L2.95443 6.35224C2.71855 7.16037 2.69053 8.01498 2.87298 8.83682L3.84922 8.6201ZM3.91437 6.63244L4.87432 6.91263C5.01585 6.42775 5.27751 5.98646 5.63505 5.62967L4.92868 4.92182L4.22232 4.21397C3.62642 4.80863 3.19031 5.54412 2.95443 6.35224L3.91437 6.63244ZM4.92868 4.92182L5.63505 5.62967C5.99259 5.27287 6.43443 5.01213 6.9196 4.87162L6.64142 3.91109L6.36324 2.95056C5.55462 3.18475 4.81822 3.61932 4.22232 4.21397L4.92868 4.92182ZM6.64142 3.91109L6.9196 4.87162C7.40478 4.73111 7.91757 4.71537 8.41045 4.82587L8.62922 3.8501L8.84798 2.87432C8.02652 2.69015 7.17186 2.71638 6.36324 2.95056L6.64142 3.91109ZM8.62922 3.8501L9.47172 4.38879C9.743 3.96452 10.1167 3.61536 10.5584 3.37351L10.0782 2.49638L9.5979 1.61926C8.86172 2.02235 8.23885 2.60428 7.78672 3.3114L8.62922 3.8501ZM10.0782 2.49638L10.5584 3.37351C11.0001 3.13165 11.4956 3.00488 11.9992 3.00488V2.00488V1.00488C11.1599 1.00488 10.3341 1.21617 9.5979 1.61926L10.0782 2.49638ZM11.9992 2.00488V3.00488C12.5028 3.00488 12.9983 3.13165 13.44 3.37351L13.9203 2.49638L14.4005 1.61926C13.6643 1.21617 12.8385 1.00488 11.9992 1.00488V2.00488ZM13.9203 2.49638L13.44 3.37351C13.8817 3.61536 14.2554 3.96452 14.5267 4.38879L15.3692 3.8501L16.2117 3.3114C15.7596 2.60428 15.1367 2.02235 14.4005 1.61926L13.9203 2.49638ZM15.3692 3.8501L15.5886 4.82574C16.0822 4.71476 16.5959 4.73042 17.0818 4.87128L17.3602 3.91081L17.6386 2.95034C16.8287 2.71559 15.9726 2.68948 15.1499 2.87445L15.3692 3.8501ZM17.3602 3.91081L17.0818 4.87128C17.5678 5.01213 18.0102 5.2736 18.368 5.63136L19.0751 4.92425L19.7822 4.21714C19.1859 3.62088 18.4485 3.1851 17.6386 2.95034L17.3602 3.91081ZM19.0751 4.92425L18.368 5.63136C18.7257 5.98912 18.9872 6.43155 19.128 6.91749L20.0885 6.6391L21.049 6.3607C20.8142 5.55079 20.3784 4.81341 19.7822 4.21714L19.0751 4.92425ZM20.0885 6.6391L19.128 6.91749C19.2689 7.40344 19.2846 7.91712 19.1736 8.41074L20.1492 8.6301L21.1249 8.84945C21.3098 8.02674 21.2837 7.17062 21.049 6.3607L20.0885 6.6391ZM20.1492 8.6301L19.6105 9.4726C20.0348 9.74388 20.3839 10.1176 20.6258 10.5593L21.5029 10.079L22.3801 9.59879C21.977 8.8626 21.395 8.23973 20.6879 7.7876L20.1492 8.6301ZM21.5029 10.079L20.6258 10.5593C20.8677 11.001 20.9944 11.4965 20.9944 12.0001H21.9944H22.9944C22.9944 11.1608 22.7831 10.335 22.3801 9.59879L21.5029 10.079ZM21.9944 12.0001H20.9944C20.9944 12.5037 20.8677 12.9992 20.6258 13.4409L21.5029 13.9211L22.3801 14.4014C22.7831 13.6652 22.9944 12.8394 22.9944 12.0001H21.9944ZM21.5029 13.9211L20.6258 13.4409C20.3839 13.8826 20.0348 14.2563 19.6105 14.5276L20.1492 15.3701L20.6879 16.2126C21.395 15.7605 21.977 15.1376 22.3801 14.4014L21.5029 13.9211ZM20.1492 15.3701L19.1734 15.5889C19.2839 16.0817 19.2682 16.5945 19.1277 17.0797L20.0882 17.3579L21.0488 17.6361C21.2829 16.8274 21.3092 15.9728 21.125 15.1513L20.1492 15.3701ZM20.0882 17.3579L19.1277 17.0797C18.9872 17.5649 18.7264 18.0067 18.3696 18.3643L19.0775 19.0706L19.7853 19.777C20.38 19.1811 20.8146 18.4447 21.0488 17.6361L20.0882 17.3579ZM19.0775 19.0706L18.3696 18.3643C18.0129 18.7218 17.5716 18.9835 17.0867 19.125L17.3669 20.0849L17.6471 21.0449C18.4552 20.809 19.1907 20.3729 19.7853 19.777L19.0775 19.0706ZM17.3669 20.0849L17.0867 19.125C16.6018 19.2665 16.089 19.2833 15.5959 19.1739L15.3792 20.1501L15.1625 21.1263C15.9843 21.3088 16.8389 21.2808 17.6471 21.0449L17.3669 20.0849ZM15.3792 20.1501L14.5355 19.6134C14.2645 20.0393 13.8905 20.3899 13.4481 20.6329L13.9293 21.5094L14.4106 22.386C15.1481 21.9811 15.7714 21.3967 16.223 20.6868L15.3792 20.1501ZM13.9293 21.5094L13.4481 20.6329C13.0056 20.8758 12.509 21.0032 12.0042 21.0032V22.0032V23.0032C12.8455 23.0032 13.6732 22.7909 14.4106 22.386L13.9293 21.5094ZM12.0042 22.0032V21.0032C11.4994 21.0032 11.0028 20.8758 10.5604 20.6329L10.0791 21.5094L9.59781 22.386C10.3352 22.7909 11.1629 23.0032 12.0042 23.0032V22.0032ZM10.0791 21.5094L10.5604 20.6329C10.1179 20.3899 9.7439 20.0393 9.47297 19.6134L8.62922 20.1501L7.78547 20.6868C8.23701 21.3967 8.86037 21.9811 9.59781 22.386L10.0791 21.5094ZM8.62922 20.1501L8.41045 19.1743C7.91757 19.2848 7.40478 19.2691 6.9196 19.1286L6.64142 20.0891L6.36324 21.0496C7.17186 21.2838 8.02653 21.31 8.84798 21.1259L8.62922 20.1501ZM6.64142 20.0891L6.9196 19.1286C6.43443 18.9881 5.99259 18.7273 5.63505 18.3705L4.92868 19.0784L4.22232 19.7862C4.81822 20.3809 5.55462 20.8154 6.36324 21.0496L6.64142 20.0891ZM4.92868 19.0784L5.63505 18.3705C5.27751 18.0137 5.01585 17.5724 4.87432 17.0876L3.91437 17.3678L2.95443 17.648C3.19031 18.4561 3.62642 19.1916 4.22232 19.7862L4.92868 19.0784ZM3.91437 17.3678L4.87432 17.0876C4.73279 16.6027 4.71598 16.0899 4.82545 15.5968L3.84922 15.3801L2.87298 15.1634C2.69053 15.9852 2.71855 16.8398 2.95443 17.648L3.91437 17.3678ZM3.84922 15.3801L4.38398 14.5351C3.95645 14.2645 3.60429 13.8902 3.36027 13.447L2.48426 13.9293L1.60826 14.4116C2.01497 15.1503 2.6019 15.7742 3.31445 16.2251L3.84922 15.3801ZM2.48426 13.9293L3.36027 13.447C3.11624 13.0038 2.98828 12.5061 2.98828 12.0001H1.98828H0.988281C0.988281 12.8434 1.20155 13.6729 1.60826 14.4116L2.48426 13.9293ZM1.98828 12.0001H2.98828C2.98828 11.4941 3.11624 10.9964 3.36027 10.5532L2.48426 10.0709L1.60826 9.58858C1.20155 10.3273 0.988281 11.1568 0.988281 12.0001H1.98828ZM2.48426 10.0709L3.36027 10.5532C3.60429 10.11 3.95645 9.73566 4.38398 9.4651L3.84922 8.6201L3.31445 7.7751C2.6019 8.22604 2.01497 8.84988 1.60826 9.58858L2.48426 10.0709Z"
                                              fill="#16A34A"
                                            />
                                            <path
                                              d="M9 12L11 14L15 10"
                                              stroke="#16A34A"
                                              strokeWidth="2"
                                              strokeLinecap="square"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
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
              </ScrollArea>

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
        <TwitterVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={onVerificationModalClose}
          status={verificationStatus}
        />
      </SideDrawerContent>
    </SideDrawer>
  );
};
