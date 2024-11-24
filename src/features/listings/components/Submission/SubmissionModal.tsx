import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  Link,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SolarMail } from '@/constants';

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

interface EligibilityAnswer {
  question: string;
  answer: string;
}

type FormFields = Record<string, string>;

export const SubmissionModal = ({
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
  const [error, setError] = useState<any>('');
  const [askError, setAskError] = useState('');
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm();

  const { user, refetchUser } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    const fetchData = async () => {
      if (editMode && id) {
        try {
          const response = await axios.get('/api/submission/get/', {
            params: { id },
          });

          const {
            link: applicationLink,
            tweet: tweetLink,
            otherInfo,
            eligibilityAnswers,
            ask,
          } = response.data;

          setValue('applicationLink', applicationLink);
          setValue('tweetLink', tweetLink);
          setValue('otherInfo', otherInfo);
          setValue('ask', ask);

          if (eligibility) {
            eligibilityAnswers.forEach((curr: EligibilityAnswer) => {
              const index = eligibility.findIndex(
                (e) => e.question === curr.question,
              );

              if (index !== -1) {
                setValue(
                  `eligibility-${eligibility[index]!.order}`,
                  curr.answer,
                );
              }
            }, {} as FormFields);
          }
        } catch (error) {
          console.error('Failed to fetch submission data', error);
        }
      }
    };

    fetchData();
  }, [id, editMode, reset, listing]);

  useEffect(() => {
    if (user?.publicKey) setValue('publicKey', user?.publicKey);
  }, [user]);

  const submitSubmissions = async (data: any) => {
    posthog.capture('confirmed_submission');
    setIsLoading(true);
    try {
      const { applicationLink, tweetLink, otherInfo, ask, ...answers } = data;
      const eligibilityAnswers =
        eligibility?.map((q) => ({
          question: q.question,
          answer: answers[`eligibility-${q.order}`],
        })) ?? [];

      const submissionEndpoint = editMode
        ? '/api/submission/update/'
        : '/api/submission/create/';

      await axios.post(submissionEndpoint, {
        listingId: id,
        link: applicationLink || '',
        tweet: tweetLink || '',
        otherInfo: otherInfo || '',
        ask: ask || null,
        eligibilityAnswers: eligibilityAnswers?.length
          ? eligibilityAnswers
          : null,
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

      onClose();
    } catch (e) {
      setError('Sorry! Please try again or contact support.');
      setIsLoading(false);
    }
  };

  let headerText = '';
  let subheadingText: JSX.Element | string = '';
  switch (type) {
    case 'project':
      headerText = '提交申请';
      subheadingText = (
        <>
          先不要开始工作！请先申请，只有在您被聘用后再开始工作
          <Text mt={1}>
            请注意项目方可能会在决定最终人选之前先联系您，了解更多情况。
          </Text>
        </>
      );
      break;
    case 'bounty':
      headerText = '提交赏金任务';
      subheadingText = '非常期待您的创作';
      break;
    case 'hackathon':
      headerText = 'Solana Hackathon';
      subheadingText = (
        <>
          注意：
          <Text>
            1. 在“作品链接”栏中，提交您的黑客马拉松
            项目最有用的链接（可以是视频、GitHub 链接、网站等）、
            网站等）
          </Text>
          <Text>
            2. 要有资格参加不同的挑战赛，您需要分别向每个挑战赛提交申请
          </Text>
          <Text>
            3.您可以提交的挑战数量不受限制
          </Text>
        </>
      );
      break;
  }

  return (
    <Modal
      closeOnOverlayClick={false}
      isCentered
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior={'inside'}
      size={'xl'}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px={{ base: 4, md: 10 }} pt={8} color="brand.slate.800">
          {headerText}
          <Text mt={1} color={'brand.slate.500'} fontSize="sm" fontWeight={400}>
            {subheadingText}
          </Text>
        </ModalHeader>
        <ModalCloseButton mt={5} />
        <VStack
          align={'start'}
          gap={3}
          overflowY={'auto'}
          maxH={'50rem'}
          px={{ base: 4, md: 10 }}
          pb={10}
        >
          <Box></Box>
          <form
            style={{ width: '100%' }}
            onSubmit={handleSubmit((e) => {
              submitSubmissions(e);
            })}
          >
            <VStack gap={4} mb={5}>
              {!isProject && (
                <>
                  <TextAreaWithCounter
                    id="applicationLink"
                    label="提交链接"
                    helperText="请确保此链接对所有人可访问!"
                    placeholder=""
                    register={register}
                    watch={watch}
                    maxLength={500}
                    errors={errors}
                    isRequired
                  />
                  <TextAreaWithCounter
                    id="tweetLink"
                    label="推文链接"
                    helperText="这有助于项目方在 X 上发现和转发您的作品。如果此提交本身便是针对 X 赏金任务，
添加推文链接，您可以忽略此条。"
                    placeholder=""
                    register={register}
                    watch={watch}
                    maxLength={500}
                    errors={errors}
                  />
                </>
              )}
              {eligibility &&
                eligibility?.map((e) => {
                  return (
                    <Box key={e.order} w="full">
                      <RichTextInputWithHelper
                        control={control}
                        label={e?.question}
                        id={`eligibility-${e?.order}`}
                        isRequired
                      />
                    </Box>
                  );
                })}

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
                      borderColor={'brand.slate.300'}
                      focusBorderColor="brand.purple"
                      id="ask"
                      {...register('ask', {
                        valueAsNumber: true,
                        validate: (value) => {
                          if (
                            compensationType === 'range' &&
                            minRewardAsk &&
                            maxRewardAsk
                          ) {
                            if (value < minRewardAsk || value > maxRewardAsk) {
                              setAskError(
                                `Compensation must be between ${minRewardAsk} and ${maxRewardAsk} ${token}`,
                              );
                              return false;
                            }
                          }
                          return true;
                        },
                      })}
                      type="number"
                    />
                  </InputGroup>
                  <Text mt={1} ml={1} color="red" fontSize="14px">
                    {askError}
                  </Text>
                </FormControl>
              )}
              <RichTextInputWithHelper
                control={control}
                label="其他?"
                id={`otherInfo`}
                helperText="如果您有其他链接或信息与我们分享，请在此处添加"
                placeholder=""
              />

              <TextInputWithHelper
                id="publicKey"
                label="你的 Solana 钱包地址"
                helperText={
                  <>
                    这是您收取奖励的钱包地址。如果您想编辑，{' '}
                    <Text as="u">
                      <Link
                        color="blue.600"
                        href={`/t/${user?.username}/edit`}
                        isExternal
                      >
                        请点击这里
                      </Link>
                    </Text>{' '}
                  </>
                }
                placeholder=""
                register={register}
                errors={errors}
                defaultValue={user?.publicKey}
                readOnly
              />
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
                      我确认我已查看了此项目的范围，并且我的提交符合指定的要求。
                      提交不符合提交要求的项目（包括在垃圾邮件中），可能会导致未来提交受到限制。
                    </Text>
                  </Flex>
                </FormControl>
              )}
            </VStack>
            {!!error && (
              <Text align="center" mb={2} color="red">
                提交时出现错误<br />
                请联系{SolarMail}
              </Text>
            )}
            <Button
              className="ph-no-capture"
              w={'full'}
              isDisabled={isTemplate || listing.status === 'PREVIEW'}
              isLoading={!!isLoading}
              loadingText="提交中"
              type="submit"
              variant="solid"
            >
              {!isProject ? '提交' : '申请'}
            </Button>
            <Text
              mt={2}
              color="brand.slate.400"
              fontSize="sm"
              textAlign="center"
            >
              提交/申请此任务，即表示您同意我们的{' '}
              <Link
                textDecoration={'underline'}
                onClick={() => setIsTOSModalOpen(true)}
                rel="noopener noreferrer"
                target="_blank"
                textUnderlineOffset={2}
              >
                使用条款
              </Link>
              .
            </Text>
          </form>
        </VStack>
        {listing?.sponsor?.name && (
          <SubmissionTerms
            entityName={listing.sponsor.entityName}
            isOpen={isTOSModalOpen}
            onClose={() => setIsTOSModalOpen(false)}
            sponsorName={listing.sponsor.name}
          />
        )}
      </ModalContent>
    </Modal>
  );
};
