import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Image,
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

import type { ListingStoreType } from '../../types';
import { getSuggestions, splitSkills } from '../../utils';
import { SelectSponsor } from '../SelectSponsor';

interface Props {
  useFormStore: () => ListingStoreType;
  editable: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
  setSteps: Dispatch<SetStateAction<number>>;
  isNewOrDraft?: boolean;
  isDraftLoading: boolean;
  createDraft: () => void;
}

export const ListingBasic = ({
  useFormStore,
  editable,
  isDuplicating,
  type,
  setSteps,
  isNewOrDraft,
  isDraftLoading,
  createDraft,
}: Props) => {
  const { form, updateState } = useFormStore();
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
      pocSocials: z.string().url('Enter a valid URL'),
      deadline: z.string().optional(),
      timeToComplete: z.string().optional(),
      referredBy: z.string().optional(),
      isPrivate: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (
        form.type === 'project' &&
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
        form.type !== 'hackathon' &&
        applicationType !== 'rolling' &&
        !data.deadline
      ) {
        ctx.addIssue({
          path: ['deadline'],
          message: 'Deadline is a required field',
          code: 'custom',
        });
      }
    });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: form?.title,
      templateId: form?.templateId,
      description: form?.description,
      skills: form?.skills,
      slug: form?.slug,
      pocSocials: form?.pocSocials,
      region: form?.region,
      applicationType: form?.applicationType,
      deadline: form?.deadline,
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

  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);

  useEffect(() => {
    const skillsInfo = splitSkills(form?.skills || []);
    setSkills(skillsInfo.skills || []);
    setSubSkills(skillsInfo.subskills || []);
  }, [form?.skills]);

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
  const thirtyDaysFromNow = dayjs().add(30, 'day').format('YYYY-MM-DDTHH:mm');

  const title = watch('title');
  const slug = watch('slug');
  const applicationType = watch('applicationType');

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
    }, 500),
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

  const onSubmit = async (data: any) => {
    if (isProject && applicationType === 'rolling') {
      setValue('deadline', thirtyDaysFromNow);
    }
    if (Object.keys(errors).length > 0) {
      console.log(errors);
      return;
    } else {
      updateState({ ...data });
      setSteps(3);
    }
  };

  return (
    <>
      <VStack align={'start'} gap={3} w={'2xl'} pt={7} pb={12}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          {form?.type === 'hackathon' && !editable && (
            <Box w="100%" mb={5}>
              <SelectSponsor type="hackathon" />
            </Box>
          )}
          <FormControl w="full" mb={5} isInvalid={!!errors.title} isRequired>
            <Flex>
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
                htmlFor={'title'}
              >
                Listing Title
              </FormLabel>
              <Tooltip
                w="max"
                p="0.7rem"
                color="white"
                fontSize="0.9rem"
                fontWeight={600}
                bg="#6562FF"
                borderRadius="0.5rem"
                hasArrow
                label={`Use a short title to describe the Listing`}
                placement="right-end"
              >
                <Image
                  mt={-2}
                  alt={'Info Icon'}
                  src={'/assets/icons/info-icon.svg'}
                />
              </Tooltip>
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
                  if (suggestions.length > 0) {
                    setSuggestions(getSuggestions(e.target.value, type));
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
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
                htmlFor={'slug'}
              >
                Listing Slug
              </FormLabel>
              <Tooltip
                w="max"
                p="0.7rem"
                color="white"
                fontSize="0.9rem"
                fontWeight={600}
                bg="#6562FF"
                borderRadius="0.5rem"
                hasArrow
                label={`Use a short slug to describe the Listing`}
                placement="right-end"
              >
                <Image
                  mt={-2}
                  alt={'Info Icon'}
                  src={'/assets/icons/info-icon.svg'}
                />
              </Tooltip>
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
            // errorSkill={errorState.skills}
            // errorSubSkill={errorState.subSkills}
            setSkills={setSkills}
            setSubSkills={setSubSkills}
            skills={skills}
            subSkills={subSkills}
          />
          {session?.user?.role === 'GOD' && (
            <>
              <FormControl w="full" mb={5}>
                <Flex>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                  >
                    Listing Geography
                  </FormLabel>
                  <Tooltip
                    w="max"
                    p="0.7rem"
                    color="white"
                    fontSize="0.9rem"
                    fontWeight={600}
                    bg="#6562FF"
                    borderRadius="0.5rem"
                    hasArrow
                    label={`Select the Superteam region this listing will be available and relevant to. Only users from the region you specify will be able to apply/submit to this listing.`}
                    placement="right-end"
                  >
                    <Image
                      mt={-2}
                      alt={'Info Icon'}
                      src={'/assets/icons/info-icon.svg'}
                    />
                  </Tooltip>
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
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
                htmlFor={'pocSocials'}
              >
                Point of Contact
              </FormLabel>
              <Tooltip
                w="max"
                p="0.7rem"
                color="white"
                fontSize="0.9rem"
                fontWeight={600}
                bg="#6562FF"
                borderRadius="0.5rem"
                hasArrow
                label={`Please add a social link of the person people reach out to in case they have questions about this listing.`}
                placement="right-end"
              >
                <Image
                  mt={-2}
                  alt={'Info Icon'}
                  src={'/assets/icons/info-icon.svg'}
                />
              </Tooltip>
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
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                >
                  Application Type
                </FormLabel>
              </Flex>

              <Select
                defaultValue={'fixed'}
                {...register('applicationType', { required: true })}
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
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'deadline'}
                >
                  Deadline (in{' '}
                  {Intl.DateTimeFormat().resolvedOptions().timeZone})
                </FormLabel>
                <Tooltip
                  w="max"
                  p="0.7rem"
                  color="white"
                  fontSize="0.9rem"
                  fontWeight={600}
                  bg="#6562FF"
                  borderRadius="0.5rem"
                  hasArrow
                  label={`Select the deadline date for accepting submissions`}
                  placement="right-end"
                >
                  <Image
                    mt={-2}
                    alt={'Info Icon'}
                    src={'/assets/icons/info-icon.svg'}
                  />
                </Tooltip>
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
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                >
                  Estimated Time to Complete
                </FormLabel>
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
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                Referred By
              </FormLabel>
              <Tooltip
                w="max"
                p="0.7rem"
                color="white"
                fontSize="0.9rem"
                fontWeight={600}
                bg="#6562FF"
                borderRadius="0.5rem"
                hasArrow
                label={`Who referred you to add this listing on Superteam Earn?`}
                placement="right-end"
              >
                <Image
                  mt={-2}
                  alt={'Info Icon'}
                  src={'/assets/icons/info-icon.svg'}
                />
              </Tooltip>
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
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                Private Listing
              </FormLabel>
              <Tooltip
                w="max"
                p="0.7rem"
                color="white"
                fontSize="0.9rem"
                fontWeight={600}
                bg="#6562FF"
                borderRadius="0.5rem"
                hasArrow
                label={
                  'Private listings are only accessible through direct links and do not appear on the Superteam Earn homepage or other public pages on the website.'
                }
                placement="right-end"
              >
                <Image
                  mt={-2}
                  alt={'Info Icon'}
                  src={'/assets/icons/info-icon.svg'}
                />
              </Tooltip>
            </Flex>
            <Switch mb={2} id="email-alerts" {...register('isPrivate')} />
          </FormControl>
          <VStack gap={4} w={'full'} mt={6}>
            <Button w="100%" type="submit" variant="solid">
              Continue
            </Button>
            <Button
              w="100%"
              isDisabled={!form?.title}
              isLoading={isDraftLoading}
              onClick={() => {
                createDraft();
              }}
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
