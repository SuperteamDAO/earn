import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Select,
  Spinner,
  Switch,
  Tag,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Regions } from '@prisma/client';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { usePostHog } from 'posthog-js/react';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import slugify from 'slugify';
import { z } from 'zod';

import { SkillSelect } from '@/components/shared/SkillSelect';
import { type MultiSelectOptions } from '@/constants';
import { CombinedRegions, Superteams } from '@/constants/Superteam';
import { emailRegex, telegramRegex, twitterRegex } from '@/features/talent';
import { useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

import { useListingFormStore } from '../../store';
import { type ListingFormType } from '../../types';
import { getSuggestions, mergeSkills } from '../../utils';
import { SelectSponsor } from '../SelectSponsor';
import { ListingFormLabel, ListingTooltip } from './Form';

interface Props {
  editable: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
  setSteps: Dispatch<SetStateAction<number>>;
  isNewOrDraft?: boolean;
  isDraftLoading: boolean;
  createDraft: (data: ListingFormType, isPreview?: boolean) => Promise<void>;
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  skills: MultiSelectOptions[];
}

export const ListingBasic = ({
  editable,
  isDuplicating,
  type,
  setSteps,
  isNewOrDraft,
  isDraftLoading,
  createDraft,
  setSkills,
  setSubSkills,
  skills,
  subSkills,
}: Props) => {
  const { form, updateState } = useListingFormStore();
  const { user } = useUser();
  const { data: session } = useSession();
  const { t } = useTranslation('common');

  const isProject = type === 'project';
  const isDraft = isNewOrDraft || isDuplicating;

  const fndnPayingCheck = user?.currentSponsor?.st && !isProject;

  const slugUniqueCheck = async (slug: string) => {
    try {
      const listingId = editable && !isDuplicating ? form?.id : null;
      await axios.get(
        `/api/listings/check-slug?slug=${slug}&check=true&id=${listingId}`,
      );
      return true;
    } catch (error) {
      return false;
    }
  };

  const timeToCompleteOptions = [
    { value: '<1 Week', label: '<1 Week' },
    { value: '1-2 Weeks', label: '1-2 Weeks' },
    { value: '2-4 Weeks', label: '2-4 Weeks' },
    { value: '4-8 Weeks', label: '4-8 Weeks' },
    { value: '>8 Weeks', label: '>8 Weeks' },
  ];

  const formSchema = z
    .object({
      title: z.string().min(1, 'Title is required'),
      slug: z
        .string()
        .min(1, 'Slug is required')
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          'Slug should only contain lowercase alphabets, numbers, and hyphens',
        )
        .refine(slugUniqueCheck, {
          message: 'Slug already exists. Please try another.',
        }),
      pocSocials: z
        .string()
        .min(1, 'Point of Contact is required')
        .refine(
          (value) => {
            return (
              twitterRegex.test(value) ||
              telegramRegex.test(value) ||
              emailRegex.test(value)
            );
          },
          {
            message: 'Please enter a valid X / Telegram link, or email address',
          },
        ),
      region: z.string().optional(),
      applicationType: z.string().optional(),
      deadline: z.string().optional(),
      timeToComplete: z.string().nullable().optional(),
      referredBy: z.string().nullable().optional(),
      isPrivate: z.boolean(),
      isFndnPaying: z.boolean()?.optional(),
    })
    .superRefine((data, ctx) => {
      if (
        type === 'project' &&
        !timeToCompleteOptions.some(
          (option) => option.value === data.timeToComplete,
        )
      ) {
        ctx.addIssue({
          path: ['timeToComplete'],
          message: 'Time to complete is required for projects',
          code: 'custom',
        });
      }
      if (
        type !== 'hackathon' &&
        applicationType !== 'rolling' &&
        !data.deadline
      ) {
        ctx.addIssue({
          path: ['deadline'],
          message: 'Deadline is required',
          code: 'custom',
        });
      }
    });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: form?.title,
      slug: form?.slug,
      skills: form?.skills,
      pocSocials: form?.pocSocials,
      region: form?.region,
      applicationType: form?.applicationType,
      deadline: form?.deadline || undefined,
      timeToComplete: form?.timeToComplete,
      referredBy: form?.referredBy,
      isPrivate: form?.isPrivate,
      isFndnPaying: form?.isFndnPaying || fndnPayingCheck ? true : false,
    },
  });

  const deadlineOptions = [
    { label: '1 Week', value: 7 },
    { label: '2 Weeks', value: 14 },
    { label: '3 Weeks', value: 21 },
  ];

  useEffect(() => {
    if (editable) {
      reset({
        title: form?.title,
        slug: form?.slug,
        deadline: form?.deadline
          ? dayjs(form?.deadline).format('YYYY-MM-DDTHH:mm')
          : undefined,
        skills: form?.skills,
        pocSocials: form?.pocSocials,
        region: form?.region,
        applicationType: form?.applicationType || 'fixed',
        timeToComplete: form?.timeToComplete,
        referredBy: form?.referredBy,
        isPrivate: form?.isPrivate,
        isFndnPaying: form?.isFndnPaying,
      });
    }
  }, [form, user?.currentSponsor?.name, isProject]);

  const title = watch('title');
  const slug = watch('slug');
  const applicationType = watch('applicationType');
  const isPrivate = watch('isPrivate');
  const isFndnPaying = watch('isFndnPaying');

  const handleDeadlineSelection = (days: number) => {
    const deadlineDate = dayjs().add(days, 'day').format('YYYY-MM-DDTHH:mm');
    setValue('deadline', deadlineDate);
  };

  const [isSlugGenerating, setIsSlugGenerating] = useState(false);

  const [shouldSlugGenerate, setShouldSlugGenerate] = useState(false);

  const [suggestions, setSuggestions] = useState<
    {
      label: string;
      link: string;
    }[]
  >([]);

  const date = dayjs().format('YYYY-MM-DD');

  const getUniqueSlug = async () => {
    if ((title && !editable) || (title && isDuplicating)) {
      setIsSlugGenerating(true);
      try {
        const slugifiedTitle = slugify(title, {
          lower: true,
          strict: true,
        });
        const newSlug = await axios.get(
          `/api/listings/check-slug?slug=${slugifiedTitle}&check=false`,
        );
        setIsSlugGenerating(false);
        return newSlug.data.slug;
      } catch (error) {
        setIsSlugGenerating(false);
        throw error;
      }
    }
  };

  const debouncedGetUniqueSlug = useCallback(
    debounce(async () => {
      const newSlug = await getUniqueSlug();
      setValue('slug', newSlug);
    }, 300),
    [title],
  );

  const debouncedPocSocialsValidation = useCallback(
    debounce(() => {
      trigger('pocSocials');
    }, 500),
    [],
  );

  useEffect(() => {
    if (
      (title && shouldSlugGenerate && !editable) ||
      (title && !slug && form.templateId !== undefined && !editable)
    ) {
      debouncedGetUniqueSlug();
    } else {
      setShouldSlugGenerate(true);
    }
    return () => {
      debouncedGetUniqueSlug.cancel();
    };
  }, [title]);

  const [maxDeadline, setMaxDeadline] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (editable && form?.deadline) {
      const originalDeadline = dayjs(form.deadline);
      const twoWeeksLater = originalDeadline.add(2, 'weeks');
      setMaxDeadline(twoWeeksLater.format('YYYY-MM-DDTHH:mm'));
    }
  }, [editable, form?.deadline]);

  const posthog = usePostHog();

  const onSubmit = (data: any) => {
    if (Object.keys(errors).length > 0) {
      console.log(errors);
      return;
    } else {
      const mergedSkills = mergeSkills({
        skills: skills,
        subskills: subSkills,
      });
      updateState({ ...data, skills: mergedSkills });
      posthog.capture('basics_sponsor');
      setSteps(3);
    }
  };

  const onDraftClick = async (isPreview: boolean = false) => {
    const data = getValues();
    const mergedSkills = mergeSkills({
      skills: skills,
      subskills: subSkills,
    });
    const formData = { ...form, ...data, skills: mergedSkills };
    if (isNewOrDraft || isDuplicating) {
      posthog.capture('save draft_sponsor');
    } else {
      posthog.capture('edit listing_sponsor');
    }
    createDraft(formData, isPreview);
  };

  return (
    <>
      <VStack align={'start'} gap={3} w={'2xl'} pt={5} pb={12}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          {type === 'hackathon' && !editable && (
            <Box w="100%" mb={5}>
              <SelectSponsor type="hackathon" />
            </Box>
          )}
          <FormControl w="full" mb={5} isInvalid={!!errors.title} isRequired>
            <Flex>
              <ListingFormLabel htmlFor={'title'}>
                {t('ListingBasic.listingTitle')}
              </ListingFormLabel>
              <ListingTooltip label={t('ListingBasic.titleTooltip')} />
            </Flex>

            <Input
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.300',
              }}
              focusBorderColor="brand.purple"
              id="title"
              maxLength={80}
              {...register('title', {
                required: true,
                onChange: (e) => {
                  const suggestedListings = getSuggestions(
                    e.target.value,
                    type,
                  );
                  if (suggestedListings) {
                    setSuggestions(suggestedListings);
                  }
                },
              })}
              placeholder={t('ListingBasic.titlePlaceholder')}
            />
            <Text
              color={(title?.length || 0) > 70 ? 'red' : 'brand.slate.400'}
              fontSize={'xs'}
              textAlign="right"
            >
              {title &&
                title?.length > 50 &&
                (80 - title?.length === 0 ? (
                  <p>{t('ListingBasic.characterLimitReached')}</p>
                ) : (
                  <p>
                    {t('ListingBasic.charactersLeft', {
                      count: 80 - (title.length || 0),
                    })}
                  </p>
                ))}
            </Text>
            {suggestions.length > 0 && (
              <Flex
                gap={1}
                mt={1.5}
                color="green.500"
                fontSize={'xs'}
                fontWeight={500}
                fontStyle="italic"
              >
                <Text w="max-content">
                  {t('ListingBasic.referenceListings')}:
                </Text>
                <Flex align="center" wrap="wrap" columnGap={1.5}>
                  {suggestions.map((suggestion, index) => (
                    <Flex key={suggestion.link} align="center" gap={2}>
                      <Link
                        className="ph-no-capture"
                        key={suggestion.link}
                        textDecoration="underline"
                        href={suggestion.link}
                        isExternal
                        onClick={() => {
                          posthog.capture('similar listings_sponsor');
                        }}
                        target="_blank"
                      >
                        {suggestion.label}
                        {suggestions.length - 1 !== index && ';'}
                      </Link>
                      {suggestions.length - 1 === index && (
                        <ExternalLinkIcon color="brand.slate.400" />
                      )}
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            )}
            <FormErrorMessage>
              {errors.title ? <>{errors.title.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl w="full" mb={5} isInvalid={!!errors.slug} isRequired>
            <Flex>
              <ListingFormLabel htmlFor={'slug'}>
                {t('ListingBasic.listingSlug')}
              </ListingFormLabel>
              <ListingTooltip label={t('ListingBasic.slugTooltip')} />
            </Flex>
            <FormHelperText
              mt={-1.5}
              mb={2.5}
              ml={0}
              color="brand.slate.400"
              fontSize={'13px'}
            >
              {t('ListingBasic.slugHelperText')}
            </FormHelperText>

            <InputGroup>
              <Input
                borderColor="brand.slate.300"
                _placeholder={{
                  color: 'brand.slate.300',
                }}
                focusBorderColor="brand.purple"
                id="slug"
                isDisabled={!isDuplicating && !!form?.publishedAt}
                {...register('slug', {
                  required: true,
                  onChange: (e) => {
                    const newValue = e.target.value
                      .replace(/\s+/g, '-')
                      .toLowerCase();
                    setValue('slug', newValue);
                  },
                })}
                placeholder={t('ListingBasic.slugPlaceholder')}
              />
              {isSlugGenerating && (
                <InputRightElement>
                  <Spinner size="sm" />
                </InputRightElement>
              )}
            </InputGroup>
            <FormErrorMessage>
              {errors.slug ? <>{errors.slug.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <SkillSelect
            setSkills={setSkills}
            setSubSkills={setSubSkills}
            skills={skills}
            subSkills={subSkills}
          />
          <FormControl w="full" mb={5} isInvalid={!!errors.region}>
            <Flex>
              <ListingFormLabel htmlFor="region">
                {t('ListingBasic.listingGeography')}
              </ListingFormLabel>
              <ListingTooltip label={t('ListingBasic.geographyTooltip')} />
            </Flex>
            <Select {...register('region')}>
              <option value={Regions.GLOBAL}>{t('ListingBasic.global')}</option>
              {CombinedRegions.map((region) => (
                <option value={region.region} key={region.displayValue}>
                  {region.displayValue}
                </option>
              ))}
            </Select>

            <FormErrorMessage>
              {errors.region ? <>{errors.region.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            w="full"
            mb={5}
            isInvalid={!!errors.pocSocials}
            isRequired
          >
            <Flex>
              <ListingFormLabel htmlFor={'pocSocials'}>
                {t('ListingBasic.pointOfContact')}
              </ListingFormLabel>
              <ListingTooltip label={t('ListingBasic.pocTooltip')} />
            </Flex>

            <Input
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.300',
              }}
              focusBorderColor="brand.purple"
              id="pocSocials"
              {...register('pocSocials', {
                onChange: () => debouncedPocSocialsValidation(),
              })}
              placeholder={t('ListingBasic.pocPlaceholder')}
            />
            <FormErrorMessage>
              {errors.pocSocials ? <>{errors.pocSocials.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          {isProject && (
            <FormControl
              w="full"
              mb={5}
              isInvalid={!!errors.applicationType}
              isRequired={isProject}
            >
              <Flex>
                <ListingFormLabel htmlFor="applicationType">
                  {t('ListingBasic.applicationType')}
                </ListingFormLabel>
              </Flex>

              <Select
                defaultValue={'fixed'}
                {...register('applicationType', {
                  required: true,
                  onChange: (e) => {
                    const value = e.target.value;
                    if (value === 'rolling') {
                      handleDeadlineSelection(30);
                    }
                  },
                })}
              >
                <option value="fixed">{t('ListingBasic.fixedDeadline')}</option>
                <option value="rolling">
                  {t('ListingBasic.rollingDeadline')}
                </option>
              </Select>

              <FormErrorMessage>
                {errors.applicationType ? (
                  <>{errors.applicationType.message}</>
                ) : (
                  <></>
                )}
              </FormErrorMessage>
            </FormControl>
          )}
          {type !== 'hackathon' && applicationType !== 'rolling' && (
            <FormControl
              mb={5}
              isInvalid={!!errors.deadline}
              isRequired={applicationType ? applicationType === 'fixed' : true}
            >
              <Flex align={'center'} justify={'start'}>
                <ListingFormLabel htmlFor={'deadline'}>
                  {t('ListingBasic.deadline', {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  })}
                </ListingFormLabel>
                <ListingTooltip label={t('ListingBasic.deadlineTooltip')} />
              </Flex>
              <Tooltip
                isDisabled={!editable || !maxDeadline}
                label={
                  editable && maxDeadline
                    ? 'Max two weeks extension allowed from the original deadline'
                    : ''
                }
                placement="top"
              >
                <Input
                  w={'full'}
                  color={'brand.slate.500'}
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  css={{
                    boxSizing: 'border-box',
                    padding: '.75rem',
                    position: 'relative',
                    width: '100%',
                    '&::-webkit-calendar-picker-indicator': {
                      background: 'transparent',
                      bottom: 0,
                      color: 'transparent',
                      cursor: 'pointer',
                      height: 'auto',
                      left: 0,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 'auto',
                    },
                  }}
                  focusBorderColor="brand.purple"
                  id="deadline"
                  max={editable ? maxDeadline : undefined}
                  min={
                    session?.user.role === 'GOD' ? undefined : `${date}T00:00`
                  }
                  placeholder="deadline"
                  type={'datetime-local'}
                  {...register('deadline', { required: true })}
                />
              </Tooltip>
              <Flex align="flex-start" gap={1} mt={2}>
                {deadlineOptions.map((option) => (
                  <Tag
                    key={option.label}
                    px={3}
                    color="green.500"
                    fontSize={'11px'}
                    bg="green.100"
                    opacity={'100%'}
                    borderRadius={'full'}
                    cursor="pointer"
                    onClick={() => handleDeadlineSelection(option.value)}
                    size={'sm'}
                    variant="subtle"
                  >
                    {option.label}
                  </Tag>
                ))}
              </Flex>
              <FormErrorMessage>
                {errors.deadline ? <>{errors.deadline.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
          )}
          {isProject && (
            <FormControl
              w="full"
              mb={5}
              isInvalid={!!errors.timeToComplete}
              isRequired={isProject}
            >
              <Flex>
                <ListingFormLabel htmlFor="timeToComplete">
                  {t('ListingBasic.estimatedTimeToComplete')}
                </ListingFormLabel>
              </Flex>

              <Select
                _placeholder={{
                  color: 'brand.slate.300',
                }}
                placeholder={t('ListingBasic.selectTimeToComplete')}
                {...register('timeToComplete', { required: true })}
              >
                {timeToCompleteOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`ListingBasic.timeToComplete.${option.value}`)}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>
                {errors.timeToComplete ? (
                  <>{errors.timeToComplete.message}</>
                ) : (
                  <></>
                )}
              </FormErrorMessage>
            </FormControl>
          )}
          <FormControl w="full" mb={5} isInvalid={!!errors.referredBy}>
            <Flex>
              <ListingFormLabel htmlFor="referredBy">
                {t('ListingBasic.referredBy')}
              </ListingFormLabel>
              <ListingTooltip label={t('ListingBasic.referredByTooltip')} />
            </Flex>

            <Select
              {...register('referredBy')}
              placeholder={t('ListingBasic.selectReferrer')}
            >
              {Superteams.map((st) => (
                <option value={st.name} key={st.name}>
                  {st.name}
                </option>
              ))}
            </Select>
            <FormErrorMessage>
              {errors.referredBy ? <>{errors.referredBy.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          {fndnPayingCheck && (
            <FormControl alignItems="center" gap={3} display="flex">
              <Flex>
                <ListingFormLabel htmlFor="isFndnPaying">
                  {t('ListingBasic.foundationPaying')}
                </ListingFormLabel>
                <ListingTooltip
                  label={t('ListingBasic.foundationPayingTooltip')}
                />
              </Flex>
              <Switch
                mb={2}
                id="email-alerts"
                {...register('isFndnPaying')}
                isChecked={isFndnPaying}
              />
              <FormErrorMessage>
                {errors.isFndnPaying ? (
                  <>{errors.isFndnPaying.message}</>
                ) : (
                  <></>
                )}
              </FormErrorMessage>
            </FormControl>
          )}
          <FormControl alignItems="center" gap={3} display="flex">
            <Flex>
              <ListingFormLabel htmlFor="isPrivate">
                {t('ListingBasic.privateListing')}
              </ListingFormLabel>
              <ListingTooltip label={t('ListingBasic.privateListingTooltip')} />
            </Flex>
            <Switch
              mb={2}
              id="email-alerts"
              {...register('isPrivate')}
              isChecked={isPrivate}
            />
            <FormErrorMessage>
              {errors.isPrivate ? <>{errors.isPrivate.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <VStack gap={4} w={'full'} mt={6}>
            <Button
              className="ph-no-capture"
              w="100%"
              py={6}
              fontWeight={500}
              borderRadius="sm"
              type="submit"
              variant={!isDraft ? 'outline' : 'solid'}
            >
              {t('ListingBasic.continue')}
            </Button>
            {isDraft && (
              <HStack w="full">
                <Button
                  className="ph-no-capture"
                  w="100%"
                  py={6}
                  color="brand.purple"
                  fontWeight={500}
                  bg="#EEF2FF"
                  borderRadius="sm"
                  isLoading={isDraftLoading}
                  onClick={() => onDraftClick()}
                  variant={'ghost'}
                >
                  {t('ListingBasic.saveDraft')}
                </Button>
              </HStack>
            )}
            {!isDraft && (
              <Button
                className="ph-no-capture"
                w="100%"
                py={6}
                fontWeight={500}
                borderRadius="sm"
                isLoading={isDraftLoading}
                onClick={() => onDraftClick()}
                variant={'solid'}
              >
                {t('ListingBasic.updateListing')}
              </Button>
            )}
          </VStack>
        </form>
      </VStack>
    </>
  );
};
