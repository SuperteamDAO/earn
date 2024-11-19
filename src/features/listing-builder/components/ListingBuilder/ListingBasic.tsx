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
import axios from 'axios';
import debounce from 'lodash.debounce';
import { useSession } from 'next-auth/react';
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
import { emailRegex, telegramRegex, twitterRegex } from '@/features/talent';
import { useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

import { useListingFormStore } from '../../store';
import { type ListingFormType } from '../../types';
import { getSuggestions, mergeSkills } from '../../utils';
import { SelectSponsor } from '../SelectSponsor';
import { ListingFormLabel, ListingTooltip } from './Form';
import { RegionSelector } from './Form/RegionSelector';

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
    { value: '<1 周', label: '<1 周' },
    { value: '1-2 周', label: '1-2 周' },
    { value: '2-4 周', label: '2-4 周' },
    { value: '4-8 周', label: '4-8 周' },
    { value: '>8 周', label: '>8 周' },
  ];

  const formSchema = z
    .object({
      title: z.string().min(1, '标题是必填项'),
      slug: z
        .string()
        .min(1, 'Slug 是必填项')
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          'Slug 只能包含小写字母、数字和连字符',
        )
        .refine(slugUniqueCheck, {
          message: 'Slug 已经存在，请尝试另一个。',
        }),
      pocSocials: z
        .string()
        .min(1, '联系方式是必填项')
        .refine(
          (value) => {
            return (
              twitterRegex.test(value) ||
              telegramRegex.test(value) ||
              emailRegex.test(value)
            );
          },
          {
            message: '请输入有效的 X / Telegram 链接或电子邮件地址',
          },
        ),
      region: z.string().optional(),
      deadline: z.string(),
      timeToComplete: z.string().nullable().optional(),
      // referredBy: z.string().nullable().optional(),
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
          message: '项目需要填写完成时间',
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
    control,
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
      deadline: form?.deadline || undefined,
      timeToComplete: form?.timeToComplete,
      // referredBy: form?.referredBy,
      isPrivate: form?.isPrivate,
      isFndnPaying: form?.isFndnPaying || fndnPayingCheck ? true : false,
    },
  });

  const deadlineOptions = [
    { label: '1 周', value: 7 },
    { label: '2 周', value: 14 },
    { label: '3 周', value: 21 },
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
        timeToComplete: form?.timeToComplete,
        // referredBy: form?.referredBy,
        isPrivate: form?.isPrivate,
        isFndnPaying: form?.isFndnPaying,
      });
    }
  }, [form, user?.currentSponsor?.name, isProject]);

  const title = watch('title');
  const slug = watch('slug');
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
              <ListingFormLabel htmlFor={'title'}>任务标题</ListingFormLabel>
              <ListingTooltip label="使用简短的标题来描述任务" />
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
              placeholder="开发一个新登陆页面"
            />
            <Text
              color={(title?.length || 0) > 70 ? 'red' : 'brand.slate.400'}
              fontSize={'xs'}
              textAlign="right"
            >
              {title &&
                title?.length > 50 &&
                (80 - title?.length === 0 ? (
                  <p>字符限制已达到</p>
                ) : (
                  <p>{80 - (title.length || 0)} 个字符剩余</p>
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
                <Text w="max-content">参考任务：</Text>
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
              <ListingFormLabel htmlFor={'slug'}>任务 Slug</ListingFormLabel>
              <ListingTooltip label="使用简短的 Slug 来描述任务" />
            </Flex>
            <FormHelperText
              mt={-1.5}
              mb={2.5}
              ml={0}
              color="brand.slate.400"
              fontSize={'13px'}
            >
              任务发布后无法编辑此字段
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
                placeholder="开发一个新登陆页面"
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
          <Box w="full" mb={5}>
            <RegionSelector control={control} errors={errors} />
          </Box>
          <FormControl
            w="full"
            mb={5}
            isInvalid={!!errors.pocSocials}
            isRequired
          >
            <Flex>
              <ListingFormLabel htmlFor={'pocSocials'}>
                联系方式（TG / X / 邮箱）
              </ListingFormLabel>
              <ListingTooltip label="请提供至少一种联系方式，以便申请者与您联系" />
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
              placeholder="例如：@solarearn"
            />
            <FormErrorMessage>
              {errors.pocSocials ? <>{errors.pocSocials.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          {type !== 'hackathon' && (
            <FormControl mb={5} isInvalid={!!errors.deadline} isRequired>
              <Flex align={'center'} justify={'start'}>
                <ListingFormLabel htmlFor={'deadline'}>
                  截止日期（北京/香港/新加坡时间，UTC+8）
                </ListingFormLabel>
                <ListingTooltip label="请选择任务的截止日期和时间" />
              </Flex>
              <Tooltip
                isDisabled={!editable || !maxDeadline}
                label={
                  editable && maxDeadline && session?.user.role !== 'GOD'
                    ? '最多允许从原始截止日期延长两周'
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
                  max={
                    editable && session?.user.role !== 'GOD'
                      ? maxDeadline
                      : undefined
                  }
                  min={
                    session?.user.role === 'GOD' ? undefined : `${date}T00:00`
                  }
                  placeholder="截止日期"
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
                  预计完成时间
                </ListingFormLabel>
              </Flex>

              <Select
                _placeholder={{
                  color: 'brand.slate.300',
                }}
                placeholder="选择完成时间"
                {...register('timeToComplete', { required: true })}
              >
                {timeToCompleteOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
          {fndnPayingCheck && (
            <FormControl alignItems="center" gap={3} display="flex">
              <Flex>
                <ListingFormLabel htmlFor="isFndnPaying">
                  是否由 Solana Foundation 支付？
                </ListingFormLabel>
                <ListingTooltip label='如果设置为"是"，Earn 将自动向该任务的获胜者发送 Foundation-KYC 表单。Foundation 将直接向获胜者付款。' />
              </Flex>
              <Switch
                mb={2}
                id="isFndnPaying"
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
                任务可见性
              </ListingFormLabel>
              <ListingTooltip label="选择任务是否公开显示" />
            </Flex>
            <Switch
              mb={2}
              id="isPrivate"
              {...register('isPrivate')}
              isChecked={isPrivate}
            />
            <FormHelperText>仅通过链接访问，不会在首页显示</FormHelperText>
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
              继续
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
                  保存草稿
                </Button>
                <Button
                  className="ph-no-capture"
                  w="100%"
                  py={6}
                  color="brand.purple"
                  fontWeight={500}
                  bg="#EEF2FF"
                  borderRadius="sm"
                  isLoading={isDraftLoading}
                  onClick={() => onDraftClick(true)}
                  variant={'ghost'}
                >
                  预览
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
                更新任务
              </Button>
            )}
          </VStack>
        </form>
      </VStack>
    </>
  );
};
