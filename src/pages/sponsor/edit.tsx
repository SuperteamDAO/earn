import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { IndustryList } from '@/constants';
import {
  useSlugValidation,
  useSponsorNameValidation,
} from '@/features/sponsor';
import { sponsorQuery } from '@/features/sponsor-dashboard';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

const UpdateSponsor = () => {
  const router = useRouter();
  const animatedComponents = makeAnimated();
  const { data: session, status } = useSession();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    defaultValues: {
      sponsorname: '',
      slug: '',
      sponsorurl: '',
      twitterHandle: '',
      bio: '',
      industry: '',
      entityName: '',
      telegram: '',
      wechat: '',
    },
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(true);
  const [industries, setIndustries] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user, refetchUser } = useUser();

  const {
    setSlug,
    isInvalid: isSlugInvalid,
    validationErrorMessage: slugValidationErrorMessage,
    slug,
  } = useSlugValidation();
  const {
    setSponsorName,
    isInvalid: isSponsorNameInvalid,
    validationErrorMessage: sponsorNameValidationErrorMessage,
    sponsorName,
  } = useSponsorNameValidation();

  const { data: sponsorData } = useQuery(sponsorQuery(user?.currentSponsorId));

  useEffect(() => {
    if (sponsorData) {
      const {
        bio,
        industry,
        name,
        slug,
        logo,
        twitter,
        url,
        entityName,
        telegram,
        wechat,
      } = sponsorData;
      setSponsorName(name);
      setSlug(slug);
      reset({
        bio,
        sponsorname: name,
        slug,
        sponsorurl: url,
        twitterHandle: twitter,
        entityName,
        telegram,
        wechat,
      });
      if (logo) {
        setImageUrl(logo);
      }
      setIsPhotoLoading(false);
      setIndustries(industry);
    }
  }, [sponsorData, reset, setSlug, setSponsorName]);

  const updateSponsor = async (sponsor: SponsorType) => {
    if (getValues('bio').length > 180) {
      setErrorMessage('公司简介长度超过限制');
      return;
    }
    setIsLoading(true);
    setHasError(false);
    try {
      await axios.post('/api/sponsors/edit', {
        ...sponsor,
      });
      await refetchUser();

      router.push('/dashboard/listings');
    } catch (e: any) {
      if (e?.response?.data?.error?.code === 'P2002') {
        setErrorMessage('抱歉！公司名称或用户名已经存在。');
      }
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session && status === 'loading') {
    return <></>;
  }

  return (
    <Default
      meta={
        <Meta
          title="编辑项目方资料 | Solar Earn"
          description="每个Solana机会都在这里！"
        />
      }
    >
      <VStack w="full" pt={12} pb={24}>
        <VStack>
          <Text color={'gray.700'} fontSize={'3xl'} fontWeight={700}>
            编辑项目方资料
          </Text>
        </VStack>
        <VStack w={'2xl'} pt={10}>
          <form
            onSubmit={handleSubmit(async (e) => {
              updateSponsor({
                bio: e.bio,
                industry: industries ?? '',
                name: sponsorName,
                slug: slug,
                logo: imageUrl ?? '',
                twitter: e.twitterHandle,
                url: e.sponsorurl ?? '',
                entityName: e.entityName,
                telegram: e.telegram,
                wechat: e.wechat,
              });
            })}
            style={{ width: '100%' }}
          >
            <Flex justify={'space-between'} gap={2} w={'full'}>
              <FormControl isRequired>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'sponsorname'}
                >
                  公司名称
                </FormLabel>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="sponsorname"
                  placeholder=""
                  {...register('sponsorname')}
                  isInvalid={isSponsorNameInvalid}
                  onChange={(e) => setSponsorName(e.target.value)}
                  value={sponsorName}
                />
                {isSponsorNameInvalid && (
                  <Text color={'red'} fontSize={'sm'}>
                    {sponsorNameValidationErrorMessage}
                  </Text>
                )}
                <FormErrorMessage>
                  {errors.sponsorname ? (
                    <>{errors.sponsorname.message}</>
                  ) : (
                    <></>
                  )}
                </FormErrorMessage>
              </FormControl>
              <FormControl w={'full'} isRequired>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'slug'}
                >
                  公司用户名
                </FormLabel>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="slug"
                  placeholder=""
                  {...register('slug')}
                  isInvalid={isSlugInvalid}
                  onChange={(e) => setSlug(e.target.value)}
                  value={slug}
                />
                {isSlugInvalid && (
                  <Text color={'red'} fontSize={'sm'}>
                    {slugValidationErrorMessage}
                  </Text>
                )}
                <FormErrorMessage>
                  {errors.slug ? <>{errors.slug.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </Flex>
            <HStack justify={'space-between'} w={'full'} my={6}>
              <FormControl w={'full'} isRequired>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'sponsorname'}
                >
                  公司网址
                </FormLabel>
                <Input
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="sponsorurl"
                  placeholder=""
                  {...register('sponsorurl')}
                />
                <FormErrorMessage>
                  {errors.sponsorurl ? <>{errors.sponsorurl.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
              <FormControl w={'full'} isRequired>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'twitterHandle'}
                >
                  公司推特
                </FormLabel>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  id="twitterHandle"
                  placeholder=""
                  {...register('twitterHandle')}
                />
                <FormErrorMessage>
                  {errors.twitterHandle ? (
                    <>{errors.twitterHandle.message}</>
                  ) : (
                    <></>
                  )}
                </FormErrorMessage>
              </FormControl>
            </HStack>
            <HStack w="full" my={6}>
              <FormControl w={'full'} isRequired>
                <HStack mb={2}>
                  <FormLabel
                    m={0}
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                    htmlFor={'entityName'}
                  >
                    实体名称
                  </FormLabel>
                  <Tooltip
                    fontSize="xs"
                    label="请填写您的项目的官方实体名称。如果您是DAO，请填写DAO的名称。如果您既不是实体也不是DAO，请填写您的全名。"
                  >
                    <InfoOutlineIcon
                      color="brand.slate.500"
                      w={3}
                      h={3}
                      display={{ base: 'none', md: 'block' }}
                    />
                  </Tooltip>
                </HStack>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="entityName"
                  placeholder="实体全称"
                  {...register('entityName')}
                />
                <FormErrorMessage>
                  {errors.entityName ? <>{errors.entityName.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </HStack>
            <HStack w="full" my={6}>
              <FormControl w={'full'} isRequired>
                <HStack mb={2}>
                  <FormLabel
                    m={0}
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={700}
                    htmlFor={'telegram'}
                  >
                    电报
                  </FormLabel>
                  <Tooltip fontSize="xs" label="请填写您的官方电报用户名。">
                    <InfoOutlineIcon
                      color="brand.slate.500"
                      w={3}
                      h={3}
                      display={{ base: 'none', md: 'block' }}
                    />
                  </Tooltip>
                </HStack>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="telegram"
                  placeholder="电报用户名"
                  {...register('telegram')}
                />
                <FormErrorMessage>
                  {errors.telegram ? <>{errors.telegram.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </HStack>
            <HStack w="full" my={6}>
              <FormControl w={'full'}>
                <HStack mb={2}>
                  <FormLabel
                    m={0}
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={700}
                    htmlFor={'wechat'}
                  >
                    微信
                  </FormLabel>
                  <Tooltip fontSize="xs" label="请填写您的官方微信ID。">
                    <InfoOutlineIcon
                      color="brand.slate.500"
                      w={3}
                      h={3}
                      display={{ base: 'none', md: 'block' }}
                    />
                  </Tooltip>
                </HStack>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="wechat"
                  placeholder="微信ID"
                  {...register('wechat')}
                />
              </FormControl>
            </HStack>
            <VStack align={'start'} gap={2} my={3}>
              <Heading
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                公司Logo{' '}
                <span
                  style={{
                    color: 'red',
                  }}
                >
                  *
                </span>
              </Heading>
              <HStack gap={5}>
                {isPhotoLoading ? (
                  <></>
                ) : imageUrl ? (
                  <ImagePicker
                    onChange={async (e) => {
                      setIsImageUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-sponsor');
                      setImageUrl(a);
                      setIsImageUploading(false);
                    }}
                    defaultValue={{ url: imageUrl }}
                    onReset={() => {
                      setImageUrl('');
                    }}
                  />
                ) : (
                  <ImagePicker
                    onChange={async (e) => {
                      setIsImageUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-sponsor');
                      setImageUrl(a);
                      setIsImageUploading(false);
                    }}
                    onReset={() => {
                      setImageUrl('');
                    }}
                  />
                )}
              </HStack>
            </VStack>

            <HStack justify={'space-between'} w={'full'} mt={6}>
              <FormControl w={'full'} isRequired>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'industry'}
                >
                  行业
                </FormLabel>

                <Select
                  closeMenuOnSelect={false}
                  components={animatedComponents}
                  isMulti
                  options={IndustryList.map((industry) => ({
                    value: industry,
                    label: industry,
                  }))}
                  styles={{
                    control: (baseStyles) => ({
                      ...baseStyles,
                      backgroundColor: 'brand.slate.500',
                      borderColor: 'brand.slate.300',
                    }),
                  }}
                  onChange={(e) =>
                    setIndustries(e.map((i: any) => i.value).join(', '))
                  }
                  defaultValue={industries
                    ?.split(', ')
                    .map((industry) => ({ value: industry, label: industry }))}
                  value={industries
                    ?.split(', ')
                    .map((industry) => ({ value: industry, label: industry }))}
                />
                <FormErrorMessage>
                  {errors.industry ? <>{errors.industry.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </HStack>
            <Box my={6}>
              <FormControl isRequired>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'bio'}
                >
                  公司简介
                </FormLabel>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="bio"
                  maxLength={180}
                  {...register('bio')}
                  placeholder="您的公司做什么？"
                />
                <Text
                  color={
                    (watch('bio')?.length || 0) > 160
                      ? 'red'
                      : 'brand.slate.400'
                  }
                  fontSize={'xs'}
                  textAlign="right"
                >
                  {180 - (watch('bio')?.length || 0)} 个字符
                </Text>
                <FormErrorMessage>
                  {errors.bio ? <>{errors.bio.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </Box>
            <Box mt={8}>
              {hasError && (
                <Text align="center" mb={4} color="red">
                  {errorMessage || '抱歉！编辑公司资料时发生错误！'}
                  <br />
                  请更新资料并重试或联系我们询求支持！
                </Text>
              )}
              <Button
                w="full"
                isDisabled={imageUrl === ''}
                isLoading={!!isLoading || isImageUploading}
                size="lg"
                type="submit"
                variant="solid"
              >
                更新资料
              </Button>
            </Box>
          </form>
        </VStack>
      </VStack>
    </Default>
  );
};

export default UpdateSponsor;
