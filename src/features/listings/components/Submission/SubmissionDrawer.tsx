import {
  Box,
  Button,
  Checkbox,
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
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

import RichTextInputWithHelper from '@/components/Form/RichTextInput';
import {
  TextAreaWithCounter,
  TextInputWithHelper,
} from '@/components/Form/TextAreaHelpers';
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
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
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

          const {
            link: applicationLink,
            tweet,
            otherInfo,
            eligibilityAnswers,
            ask,
          } = response.data;

          reset({
            applicationLink,
            tweet,
            otherInfo,
            ask,
            eligibilityAnswers,
            publicKey: user?.publicKey,
          });
        } catch (error) {
          console.error('Failed to fetch submission data', error);
          toast.error('Failed to load submission data');
        }
      }
    };

    fetchData();
  }, [id, editMode, reset]);

  useEffect(() => {
    if (user?.publicKey) setValue('publicKey', user?.publicKey);
  }, [user, setValue]);

  const submitSubmissions = async (data: FormData) => {
    posthog.capture('confirmed_submission');
    setIsLoading(true);
    try {
      const submissionEndpoint = editMode
        ? '/api/submission/update/'
        : '/api/submission/create/';

      await axios.post(submissionEndpoint, {
        listingId: id,
        link: data.applicationLink || '',
        tweet: data.tweet || '',
        otherInfo: data.otherInfo || '',
        ask: data.ask || null,
        eligibilityAnswers: data.eligibilityAnswers || null,
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

      reset();
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
          <form
            style={{ width: '100%' }}
            onSubmit={handleSubmit(
              (data) => {
                submitSubmissions(data);
              },
              (errors) => {
                console.log(errors);
                const firstError = Object.values(errors)[0];
                if (firstError) {
                  toast.error(firstError.message);
                }
              },
            )}
          >
            <Flex
              direction={'column'}
              overflowY="auto"
              h={'calc(100vh - 210px)'}
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
                    <TextAreaWithCounter
                      id="applicationLink"
                      label="Link to Your Submission"
                      helperText="Make sure this link is accessible by everyone!"
                      placeholder="Add a link"
                      register={register}
                      watch={watch}
                      maxLength={500}
                      errors={errors}
                      isRequired
                    />
                    <TextAreaWithCounter
                      id="tweet"
                      label="Tweet Link"
                      helperText="This helps sponsors discover (and maybe repost) your work on Twitter! If this submission is for a Twitter thread bounty, you can ignore this field."
                      placeholder="Add a tweet's link"
                      register={register}
                      watch={watch}
                      maxLength={500}
                      errors={errors}
                    />
                  </>
                )}
                {eligibility?.map((e, index) => (
                  <Box key={e.order} w="full">
                    <RichTextInputWithHelper
                      control={control}
                      label={e?.question}
                      id={`eligibilityAnswers.${index}.answer`}
                      isRequired
                    />
                  </Box>
                ))}
                {compensationType !== 'fixed' && (
                  <FormControl isRequired>
                    <FormLabel
                      mb={1}
                      color={'brand.slate.600'}
                      fontWeight={600}
                      htmlFor={'ask'}
                    >
                      What&apos;s the compensation you require to complete this
                      fully?
                    </FormLabel>
                    <InputGroup>
                      <InputLeftAddon>
                        <Image
                          w={4}
                          h={4}
                          alt={'green doller'}
                          rounded={'full'}
                          src={
                            tokenList.filter((e) => e?.tokenSymbol === token)[0]
                              ?.icon ?? '/assets/icons/green-dollar.svg'
                          }
                        />
                        <Text ml={2} color="brand.slate.500" fontWeight={500}>
                          {token}
                        </Text>
                      </InputLeftAddon>
                      <Input
                        borderColor="brand.slate.300"
                        focusBorderColor="brand.purple"
                        id="ask"
                        {...register('ask', { valueAsNumber: true })}
                        type="number"
                      />
                    </InputGroup>
                  </FormControl>
                )}
                <RichTextInputWithHelper
                  control={control}
                  label="Anything Else?"
                  id={`otherInfo`}
                  helperText="If you have any other links or information you'd like to share with us, please add them here!"
                  placeholder="Add info or link"
                />

                <TextInputWithHelper
                  id="publicKey"
                  label="Your Solana Wallet Address"
                  helperText={
                    <>
                      This is where you will receive your rewards if you win. If
                      you want to edit it,{' '}
                      <Text as="u">
                        <Link
                          color="blue.600"
                          href={`/t/${user?.username}/edit`}
                          isExternal
                        >
                          click here
                        </Link>
                      </Text>{' '}
                    </>
                  }
                  placeholder="Add your Solana wallet address"
                  register={register}
                  errors={errors}
                  defaultValue={user?.publicKey}
                  readOnly
                />
              </VStack>
            </Flex>
            <Flex direction={'column'} w="100%" py={4} bg="white">
              {isHackathon && !editMode && (
                <FormControl isRequired>
                  <Flex align="flex-start">
                    <Checkbox
                      mt={1}
                      mr={2}
                      _checked={{
                        '& .chakra-checkbox__control': {
                          background: 'brand.purple',
                          borderColor: 'brand.purple',
                        },
                      }}
                    />
                    <Text
                      alignSelf="center"
                      color={'brand.slate.600'}
                      fontSize={'sm'}
                    >
                      I confirm that I have reviewed the scope of this track and
                      that my submission adheres to the specified requirements.
                      Submitting a project that does not meet the submission
                      requirements, including potential spam, may result in
                      restrictions on future submissions.
                    </Text>
                  </Flex>
                </FormControl>
              )}
              <Button
                className="ph-no-capture"
                w={'full'}
                isDisabled={
                  isTemplate || (!listing.isPublished && !!query['preview'])
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
