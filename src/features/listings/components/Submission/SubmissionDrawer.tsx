import {
  Button,
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { type z } from 'zod';

import { RichEditor } from '@/components/shared/RichEditor';
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
import { Input } from '@/components/ui/input';
import { tokenList } from '@/constants';
import { useUser } from '@/store/user';

import { submissionCountQuery } from '../../queries';
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

  const form = useForm<FormData>({
    resolver: zodResolver(
      submissionSchema(listing, minRewardAsk || 0, maxRewardAsk || 0),
    ),
    defaultValues: {
      eligibilityAnswers:
        Array.isArray(listing.eligibility) && listing.eligibility.length > 0
          ? listing.eligibility.map((q) => ({
              question: q.question,
              answer: '',
            }))
          : undefined,
    },
  });
  const { user, refetchUser } = useUser();
  const posthog = usePostHog();
  const router = useRouter();
  const { query } = router;

  useEffect(() => {
    const fetchData = async () => {
      if (editMode && id) {
        try {
          const response = await axios.get('/api/submission/get/', {
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

      await axios.post(submissionEndpoint, {
        listingId: id,
        link: data.link || '',
        tweet: data.tweet || '',
        otherInfo: data.otherInfo || '',
        ask: data.ask || null,
        eligibilityAnswers: data.eligibilityAnswers || [],
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
          <Text mt={1}>
            Please note that the sponsor might contact you to assess fit before
            picking the winner.
          </Text>
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
          <Text>
            1. In the “Link to your Submission” field, submit your hackathon
            project’s most useful link (could be a loom video, GitHub link,
            website, etc)
          </Text>
          <Text>
            2. To be eligible for different challenges, you need to submit to
            each challenge separately
          </Text>
          <Text>
            3. {`There's no`} restriction on the number of challenges you can
            submit to
          </Text>
        </>
      );
      break;
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size={'lg'}>
      <DrawerOverlay />
      <DrawerContent flexDir="column" display="flex">
        <DrawerHeader px={{ base: 2, md: 6 }} pt={6} color="brand.slate.800">
          {headerText}
          <Text color={'brand.slate.500'} fontSize="sm" fontWeight={400}>
            {subheadingText}
          </Text>
          <DrawerCloseButton mt={5} />
        </DrawerHeader>
        <Flex
          justify={'space-between'}
          direction="column"
          h="100vh"
          px={{ base: 2, md: 6 }}
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              style={{ width: '100%' }}
            >
              <Flex
                direction={'column'}
                overflowY="auto"
                h={'calc(100vh - 250px)'}
                p={4}
                borderWidth="1px"
                borderColor="brand.slate.200"
                borderRadius={'0.5rem'}
                shadow="0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.06)"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#cbd5e1',
                    borderRadius: '30px',
                  },
                }}
              >
                <VStack gap={4} mb={5}>
                  {!isProject && (
                    <>
                      <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel isRequired>
                              Link to Your Submission
                            </FormLabel>
                            <FormDescription>
                              Make sure this link is accessible by everyone!
                            </FormDescription>
                            <FormControl>
                              <Input
                                {...field}
                                maxLength={500}
                                placeholder="Add a link"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tweet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tweet Link</FormLabel>
                            <FormDescription>
                              This helps sponsors discover (and maybe repost)
                              your work on Twitter!
                            </FormDescription>
                            <FormControl>
                              <Input
                                {...field}
                                maxLength={500}
                                placeholder="Add a tweet's link"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {eligibility?.map((e, index) => (
                    <FormField
                      key={e.order}
                      control={form.control}
                      name={`eligibilityAnswers.${index}.answer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired>{e?.question}</FormLabel>
                          <FormControl>
                            <RichEditor
                              id={`eligibility-${index}`}
                              value={field.value}
                              onChange={field.onChange}
                              error={false}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  {compensationType !== 'fixed' && (
                    <FormField
                      control={form.control}
                      name="ask"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired>
                            What&apos;s the compensation you require to complete
                            this fully?
                          </FormLabel>
                          <FormControl>
                            <div className="flex">
                              <div className="mt-2 flex items-center gap-1 rounded-l-md border border-r-0 border-input bg-muted pl-3 pr-5">
                                <Image
                                  className="h-4 w-4 rounded-full"
                                  alt="green dollar"
                                  src={
                                    tokenList.filter(
                                      (e) => e?.tokenSymbol === token,
                                    )[0]?.icon ??
                                    '/assets/icons/green-dollar.svg'
                                  }
                                />
                                <p className="font-medium text-slate-500">
                                  {token}
                                </p>
                              </div>
                              <Input
                                className="rounded-l-none"
                                {...field}
                                type="number"
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value =
                                    e.target.value === ''
                                      ? null
                                      : Number(e.target.value);
                                  field.onChange(value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="otherInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anything Else?</FormLabel>
                        <FormDescription>
                          If you have any other links...
                        </FormDescription>
                        <FormControl>
                          <RichEditor
                            id="otherInfo"
                            value={field.value || ''}
                            onChange={field.onChange}
                            error={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Your Solana Wallet Address</FormLabel>
                    <FormDescription>
                      This is where you will receive your rewards if you win. If
                      you want to edit it,{' '}
                      <span className="underline">
                        <Link
                          className="text-blue-600 hover:text-blue-700"
                          href={`/t/${user?.username}/edit`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          click here
                        </Link>
                      </span>
                    </FormDescription>
                    <Input
                      value={user?.publicKey || ''}
                      placeholder="Add your Solana wallet address"
                      className="opacity-50"
                      readOnly
                    />
                  </FormItem>
                </VStack>
              </Flex>
              <Flex
                direction={'column'}
                flex={1}
                w="100%"
                h="100%"
                mt="auto"
                py={4}
                bg="white"
              >
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
                  className="ph-no-capture"
                  w={'full'}
                  isDisabled={
                    isTemplate ||
                    (!listing.isPublished && !!query['preview']) ||
                    (isHackathon && !editMode && !termsAccepted)
                  }
                  isLoading={!!isLoading}
                  loadingText="Submitting..."
                  type="submit"
                  variant="solid"
                >
                  {!isProject ? 'Submit' : 'Apply'}
                </Button>
                <Text
                  mt={2}
                  color="brand.slate.400"
                  fontSize="sm"
                  textAlign="center"
                >
                  By submitting/applying to this listing, you agree to our{' '}
                  <Link
                    textDecoration={'underline'}
                    onClick={() => setIsTOSModalOpen(true)}
                    rel="noopener noreferrer"
                    target="_blank"
                    textUnderlineOffset={2}
                  >
                    Terms of Use
                  </Link>
                  .
                </Text>
              </Flex>
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
        </Flex>
      </DrawerContent>
    </Drawer>
  );
};
