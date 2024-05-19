import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Select,
  Spinner,
  Switch,
  Tag,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Regions } from '@prisma/client';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { useSession } from 'next-auth/react';
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

import { SkillSelect } from '@/components/misc/SkillSelect';
import { type MultiSelectOptions } from '@/constants';
import { Superteams } from '@/constants/Superteam';
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
  createDraft: (data: ListingFormType) => Promise<void>;
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
  const slugUniqueCheck = async (slug: string) => {
    try {
      const listingId = editable && !isDuplicating ? form?.id : null;
      await axios.get(
        `/api/listings/slug?slug=${slug}&check=true&id=${listingId}`,
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
      pocSocials: z.string(),
      region: z.string().optional(),
      applicationType: z.string().optional(),
      deadline: z.string().optional(),
      timeToComplete: z.string().nullable().optional(),
      referredBy: z.string().nullable().optional(),
      isPrivate: z.boolean(),
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
    formState: { errors },
  } = useForm({
    mode: 'onChange',
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
      });
    }
  }, [form]);

  const title = watch('title');
  const slug = watch('slug');
  const applicationType = watch('applicationType');
  const isPrivate = watch('isPrivate');

  const handleDeadlineSelection = (days: number) => {
    const deadlineDate = dayjs().add(days, 'day').format('YYYY-MM-DDTHH:mm');
    setValue('deadline', deadlineDate);
  };

  const [isSlugGenerating, setIsSlugGenerating] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState(true);

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
          `/api/listings/slug?slug=${slugifiedTitle}&check=false`,
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

  const isProject = type === 'project';

  const { data: session } = useSession();

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
      setSteps(3);
    }
  };

  const onDraftClick = async () => {
    const data = getValues();
    const mergedSkills = mergeSkills({
      skills: skills,
      subskills: subSkills,
    });
    const formData = { ...form, ...data, skills: mergedSkills };
    createDraft(formData);
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
                Listing Title
              </ListingFormLabel>
              <ListingTooltip label="Use a short title to describe the Listing" />
            </Flex>

            <Input
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.300',
              }}
              focusBorderColor="brand.purple"
              id="title"
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
              placeholder="Develop a new landing page"
            />
            {suggestions.length > 0 && (
              <Flex
                gap={1}
                mt={1.5}
                color="green.500"
                fontSize={'xs'}
                fontWeight={500}
                fontStyle="italic"
              >
                <Text w="max-content">Similar Listings:</Text>
                <Flex align="center" wrap="wrap" columnGap={1.5}>
                  {suggestions.map((suggestion, index) => (
                    <Flex key={suggestion.link} align="center" gap={2}>
                      <Link
                        key={suggestion.link}
                        href={suggestion.link}
                        isExternal
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
          </FormControl>
          <FormControl w="full" mb={5} isInvalid={!!errors.slug} isRequired>
            <Flex>
              <ListingFormLabel htmlFor={'slug'}>Listing Slug</ListingFormLabel>
              <ListingTooltip label="Use a short slug to describe the Listing" />
            </Flex>
            <FormHelperText
              mt={-1.5}
              mb={2.5}
              ml={0}
              color="brand.slate.400"
              fontSize={'13px'}
            >
              This field can&apos;t be edited after a listing has been published
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

                    setIsUrlValid(true);
                  },
                })}
                placeholder="develop-a-new-landing-page"
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
          {session?.user?.role === 'GOD' && (
            <>
              <FormControl w="full" mb={5}>
                <Flex>
                  <ListingFormLabel htmlFor="region">
                    Listing Geography
                  </ListingFormLabel>
                  <ListingTooltip label="Select the Superteam region this listing will be available and relevant to. Only users from the region you specify will be able to apply/submit to this listing." />
                </Flex>
                <Select {...register('region')}>
                  <option value={Regions.GLOBAL}>Global</option>
                  {Superteams.map((st) => (
                    <option value={st.region} key={st.name}>
                      {st.displayValue}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          <FormControl
            w="full"
            mb={5}
            isInvalid={!!errors.pocSocials || !isUrlValid}
            isRequired
          >
            <Flex>
              <ListingFormLabel htmlFor={'pocSocials'}>
                Point of Contact
              </ListingFormLabel>
              <ListingTooltip label="Please add a social link of the person people reach out to in case they have questions about this listing." />
            </Flex>

            <Input
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.300',
              }}
              focusBorderColor="brand.purple"
              id="pocSocials"
              {...register('pocSocials')}
              placeholder="https://twitter.com/elonmusk"
            />
            {!isUrlValid && (
              <Text color={'red'}>
                URL needs to contain &quot;https://&quot; prefix
              </Text>
            )}
          </FormControl>
          {isProject && (
            <FormControl w="full" mb={5} isRequired={isProject}>
              <Flex>
                <ListingFormLabel htmlFor="applicationType">
                  Application Type
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
                <option value="fixed">Fixed Deadline</option>
                <option value="rolling">Rolling Deadline</option>
              </Select>
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
                  Deadline (in{' '}
                  {Intl.DateTimeFormat().resolvedOptions().timeZone})
                </ListingFormLabel>
                <ListingTooltip label="Select the deadline date for accepting submissions" />
              </Flex>
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
                min={`${date}T00:00`}
                placeholder="deadline"
                type={'datetime-local'}
                {...register('deadline', { required: true })}
              />
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
                  Estimated Time to Complete
                </ListingFormLabel>
              </Flex>

              <Select
                _placeholder={{
                  color: 'brand.slate.300',
                }}
                placeholder="Select time to complete"
                {...register('timeToComplete', { required: true })}
              >
                {timeToCompleteOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl w="full" mb={5}>
            <Flex>
              <ListingFormLabel htmlFor="referredBy">
                Referred By
              </ListingFormLabel>
              <ListingTooltip label="Who referred you to add this listing on Superteam Earn?" />
            </Flex>

            <Select {...register('referredBy')} placeholder="Select">
              {Superteams.map((st) => (
                <option value={st.name} key={st.name}>
                  {st.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl alignItems="center" gap={3} display="flex">
            <Flex>
              <ListingFormLabel htmlFor="isPrivate">
                Private Listing
              </ListingFormLabel>
              <ListingTooltip label="Private listings are only accessible through direct links and do not appear on the Superteam Earn homepage or other public pages on the website." />
            </Flex>
            <Switch
              mb={2}
              id="email-alerts"
              {...register('isPrivate')}
              isChecked={isPrivate}
            />
          </FormControl>
          <VStack gap={4} w={'full'} mt={6}>
            <Button w="100%" type="submit" variant="solid">
              Continue
            </Button>
            <Button
              w="100%"
              isDisabled={!form?.title}
              isLoading={isDraftLoading}
              onClick={onDraftClick}
              variant="outline"
            >
              {isNewOrDraft || isDuplicating ? 'Save Draft' : 'Update Listing'}
            </Button>
          </VStack>
        </form>
      </VStack>
    </>
  );
};
