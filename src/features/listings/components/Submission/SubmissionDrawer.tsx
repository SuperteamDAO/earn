import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { type ClassValue } from 'clsx';
import { Check, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { type JSX, useEffect, useState } from 'react';
import {
  type Control,
  useForm,
  type UseFormReturn,
  useWatch,
} from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

import { RichEditor } from '@/components/shared/RichEditor';
import { MinimalTiptapEditor } from '@/components/tiptap';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { KycComponent } from '@/components/ui/KycComponent';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { WalletConnectField } from '@/components/ui/wallet-connect-field';
import { CHAIN_NAME } from '@/constants/project';
import { tokenList } from '@/constants/tokenList';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { InfoBox } from '@/features/sponsor-dashboard/components/InfoBox';

import { walletFieldListings } from '../../constants';
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
  const isSponsorship = type === 'sponsorship';
  const [isLoading, setIsLoading] = useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [editFetched, setEditFetched] = useState(false);

  const { user, refetchUser } = useUser();
  const form: UseFormReturn<FormData> = useForm<FormData>({
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
      token: token === 'Any' ? tokenList[0]?.tokenSymbol : undefined,
    },
  });

  const posthog = usePostHog();
  const router = useRouter();
  const { query } = router;

  const handleClose = () => {
    form.reset({
      link: '',
      tweet: '',
      otherInfo: '',
      ask: null,
      token: token === 'Any' ? tokenList[0]?.tokenSymbol : undefined,
      eligibilityAnswers: Array.isArray(listing.eligibility)
        ? listing.eligibility.map((q) => ({
            question: q.question,
            answer: '',
          }))
        : [],
      publicKey: user?.publicKey || '',
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

          const { link, tweet, otherInfo, eligibilityAnswers, ask, token } =
            response.data;

          form.reset({
            link,
            tweet,
            otherInfo,
            ask,
            eligibilityAnswers: eligibilityAnswers.map((answer: any) => ({
              question: answer.question,
              answer: answer.answer ?? '',
            })),
            token,
          });
          setEditFetched(true);
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
        token: token === 'Any' ? data.token : undefined,
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
      handleClose();
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
    case 'sponsorship':
      headerText = 'Sponsorship Submission';
      subheadingText = "We can't wait to see what you've created!";
      break;
    case 'hackathon':
      headerText = `${CHAIN_NAME} Radar Track Submission`;
      subheadingText = (
        <>
          Note:
          <p>
            1. In the &quot;Link to your Submission&quot; field, submit your
            hackathon project&apos;s most useful link (could be a loom video,
            GitHub link, website, etc)
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

  return (
    <SideDrawer open={isOpen} onClose={handleClose} className="scrollbar-none">
      <SideDrawerContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ width: '100%', height: '100%' }}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="h-full overflow-y-auto rounded-lg border border-slate-200 px-2 shadow-[0px_1px_3px_rgba(0,0,0,0.08),_0px_1px_2px_rgba(0,0,0,0.06)] md:px-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:w-1.5 [&::-webkit-scrollbar]:w-1">
                <div className="mb-4 border-b border-slate-100 bg-white py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-slate-700">
                      {headerText}
                    </p>
                    <X
                      className="h-4 w-4 text-slate-400"
                      onClick={handleClose}
                    />
                  </div>
                  <p className="text-sm text-slate-500">{subheadingText}</p>
                </div>
                <div>
                  <div className="mb-5 flex flex-col gap-4">
                    {!isProject &&
                      !isSponsorship &&
                      !walletFieldListings.includes(id!) && (
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
                                    Make sure this link is accessible by
                                    everyone!
                                  </FormDescription>
                                </div>
                                <div>
                                  <FormControl>
                                    <div className="flex">
                                      <div className="flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted px-2 shadow-sm">
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
                                    submission is for a Twitter thread bounty,
                                    you can ignore this field.
                                  </FormDescription>
                                </div>
                                <div>
                                  <FormControl>
                                    <div className="flex">
                                      <div className="flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted px-2 shadow-sm">
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
                      if (
                        walletFieldListings.includes(id!) &&
                        e.question === `Connect Your ${CHAIN_NAME} Wallet`
                      ) {
                        return (
                          <WalletConnectField
                            key={e.order}
                            control={form.control}
                            name={`eligibilityAnswers.${index}.answer`}
                            label={e.question}
                            isRequired
                            description="Connect your wallet to verify ownership. This is mandatory for this bounty."
                          />
                        );
                      }
                      if (e.type === 'checkbox') {
                        return (
                          <FormField
                            key={e.order}
                            control={form.control}
                            name={`eligibilityAnswers.${index}.answer`}
                            render={({ field }) => (
                              <FormItem className={cn('flex flex-col gap-1')}>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value === 'true'}
                                      onCheckedChange={(checked) => {
                                        field.onChange(
                                          checked ? 'true' : 'false',
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  <InfoBox
                                    content={e.question}
                                    className="mb-0"
                                    contentClassName=" [&_p]:!text-[0.9rem] [&_a]:!text-[0.9rem]"
                                    isHtml={true}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      return (
                        <FormField
                          key={e.order}
                          control={form.control}
                          name={`eligibilityAnswers.${index}.answer`}
                          render={({ field }) => (
                            <FormItem className={cn('flex flex-col gap-2')}>
                              <div>
                                <FormLabel isRequired>{e.question}</FormLabel>
                              </div>
                              <div>
                                <FormControl>
                                  {e.isLink || e.type === 'link' ? (
                                    <div className="flex">
                                      <div className="flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted px-2 shadow-sm">
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
                                  ) : e.type === 'paragraph' ? (
                                    <div className="flex rounded-md border shadow-sm ring-primary has-[:focus]:ring-1">
                                      <MinimalTiptapEditor
                                        key={`${field.name}-${editFetched ? id : ''}`}
                                        {...field}
                                        value={field.value || ''}
                                        immediatelyRender={false}
                                        className="min-h-[30vh] w-full border-0 text-sm"
                                        editorContentClassName="p-4 px-2 h-full"
                                        output="html"
                                        placeholder="Type your description here..."
                                        editable={true}
                                        editorClassName="focus:outline-none"
                                        imageSetting={{
                                          folderName:
                                            'listing-eligibility-answer',
                                          type: 'custom-question',
                                        }}
                                        toolbarClassName="sticky top-0 rounded-t-md bg-white z-[75] w-full overflow-x-hidden"
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
                        label="Total Amount"
                        description={
                          token !== 'Any'
                            ? "What's the compensation you require to complete this fully?"
                            : 'Enter the exact amount you are seeking in US dollars.'
                        }
                        isRequired
                        isTokenInput
                        token={token}
                      />
                    )}

                    {token === 'Any' && <TokenSelect control={form.control} />}

                    <FormFieldWrapper
                      control={form.control}
                      name="otherInfo"
                      label="Anything Else?"
                      description="If you have any other links or information you'd like to share with us, please add them here!"
                      isRichEditor
                      richEditorPlaceholder="Add info or link"
                    />
                    {!walletFieldListings.includes(id!) && (
                      <FormField
                        control={form.control}
                        name="publicKey"
                        render={({ field }) => (
                          <FormItem className="flex w-full flex-col gap-2">
                            <div>
                              <FormLabel isRequired={!user?.publicKey}>
                                Your {CHAIN_NAME} Wallet Address
                              </FormLabel>
                              <FormDescription>
                                {!!user?.publicKey ? (
                                  <>
                                    This is where you will receive your rewards
                                    if you win. If you want to edit it,{' '}
                                    <a
                                      href={`/t/${user?.username}/edit`}
                                      className="text-blue-600 underline hover:text-blue-700"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      click here
                                    </a>
                                  </>
                                ) : (
                                  <>
                                    This wallet address will be linked to your
                                    profile and you will receive your rewards
                                    here if you win.
                                  </>
                                )}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <div className="flex flex-col gap-2">
                                <Input
                                  className={cn(
                                    !!user?.publicKey &&
                                      'cursor-not-allowed text-slate-600 opacity-80',
                                  )}
                                  placeholder={`Add your ${CHAIN_NAME} wallet address`}
                                  readOnly={!!user?.publicKey}
                                  {...(!!user?.publicKey ? {} : field)}
                                  value={user?.publicKey || field.value}
                                />
                                <KycComponent
                                  address={user?.publicKey || field.value}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
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
      </SideDrawerContent>
    </SideDrawer>
  );
};

interface TokenSelectProps {
  control: Control<FormData>;
}

export function TokenSelect({ control }: TokenSelectProps) {
  return (
    <FormField
      name="token"
      control={control}
      render={({ field }) => (
        <FormItem className="gap-2">
          <div>
            <FormLabel>Currency</FormLabel>
            <FormDescription>
              Select your preferred currency for receiving funds. The exchange
              rate will be the closing rate at the day of the invoice.
            </FormDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    'w-full justify-between',
                    !field.value && 'text-muted-foreground',
                  )}
                >
                  {field.value ? (
                    <TokenLabel
                      control={control}
                      showIcon
                      showSymbol
                      classNames={{
                        symbol: 'text-slate-900',
                        postfix: 'text-slate-900',
                      }}
                    />
                  ) : (
                    'Select Token'
                  )}
                  <ChevronDown className="opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[33rem] p-0">
              <Command>
                <CommandInput placeholder="Search token..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No Token found.</CommandEmpty>
                  <CommandGroup>
                    {tokenList
                      .filter((token) => token.tokenSymbol !== 'Any')
                      .map((token) => (
                        <CommandItem
                          value={token.tokenName}
                          key={token.tokenSymbol}
                          onSelect={() => {
                            field.onChange(token.tokenSymbol);
                          }}
                        >
                          <TokenLabel
                            control={control}
                            token={token}
                            showIcon
                            showName
                          />
                          <Check
                            className={cn(
                              'ml-auto',
                              token.tokenSymbol === field.value
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface TokenLabelProps {
  symbol?: string;
  className?: ClassValue;
  showIcon?: boolean;
  showSymbol?: boolean;
  showName?: boolean;
  postfix?: string;
  amount?: number | null;
  token?: (typeof tokenList)[0];
  classNames?: {
    icon?: ClassValue;
    symbol?: ClassValue;
    amount?: ClassValue;
    postfix?: ClassValue;
    name?: ClassValue;
  };
  control: Control<FormData>;
  formatter?: (amount: number) => string;
}

const defaultFormatter = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);

export function TokenLabel({
  symbol,
  className,
  showIcon = true,
  showSymbol = false,
  showName = false,
  postfix,
  amount,
  classNames,
  token: preToken,
  formatter = defaultFormatter,
  control,
}: TokenLabelProps) {
  const formToken = useWatch({
    control: control,
    name: 'token',
  });

  const searchSymbol = symbol || formToken;
  const token =
    preToken || tokenList.find((token) => token.tokenSymbol === searchSymbol);

  if (!token) return null;
  return (
    <span className={cn('flex w-max items-center', className)}>
      {showIcon && (
        <img
          src={token.icon}
          alt={token.tokenSymbol}
          className={cn('mr-1 block h-4 w-4', classNames?.icon)}
        />
      )}
      {typeof amount === 'number' && !isNaN(amount) && (
        <span className={cn('ml-2 text-sm', classNames?.amount)}>
          {formatter(amount)}
        </span>
      )}
      {showName && (
        <span className={cn('ml-2 text-sm', classNames?.symbol)}>
          {token.tokenName}
        </span>
      )}
      {showSymbol && (
        <span className={cn('ml-2 text-sm', classNames?.symbol)}>
          {token.tokenSymbol}
        </span>
      )}
      {postfix && (
        <span className={cn('ml-1 text-sm', classNames?.postfix)}>
          {postfix}
        </span>
      )}
    </span>
  );
}
