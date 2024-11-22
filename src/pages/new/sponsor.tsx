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
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { IndustryList } from '@/constants';
import { SignIn } from '@/features/auth';
import {
  useSlugValidation,
  useSponsorNameValidation,
} from '@/features/sponsor';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

const CreateSponsor = () => {
  const router = useRouter();
  const animatedComponents = makeAnimated();
  const { data: session, status } = useSession();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    getValues,
  } = useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [industries, setIndustries] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loginStep, setLoginStep] = useState<number>(0);

  const { user } = useUser();
  const posthog = usePostHog();

  const {
    setSponsorName,
    isInvalid: isSponsorNameInvalid,
    validationErrorMessage: sponsorNameValidationErrorMessage,
    sponsorName,
  } = useSponsorNameValidation();
  const { setSlug, isInvalid, validationErrorMessage, slug } =
    useSlugValidation();

  useEffect(() => {
    if (user?.currentSponsorId && session?.user?.role !== 'GOD') {
      router.push('/dashboard/listings?open=1');
    }
  }, [user?.currentSponsorId, router]);

  const createNewSponsor = async (sponsor: SponsorType) => {
    if (getValues('bio').length > 180) {
      setErrorMessage('公司简介长度超过限制');
      return;
    }
    setIsLoading(true);
    setHasError(false);
    try {
      await axios.post('/api/sponsors/create', {
        ...sponsor,
      });
      await axios.post(`/api/email/manual/welcome-sponsor`);
      router.push('/dashboard/listings?open=1');
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setErrorMessage('抱歉，您没有创建项目方的权限。');
      }
      if (e?.response?.data?.error?.code === 'P2002') {
        setErrorMessage('抱歉，项目方名称或用户名已经存在。');
      }
      setIsLoading(false);
      setHasError(true);
    }
  };

  if (!session && status === 'loading') {
    return <></>;
  }

  return (
    <Default
      meta={
        <Meta
          title="创建项目方 | Solar Earn"
          description="每个 Solana 机会都在这里！"
          canonical="https://earn.superteam.fun/new/sponsor/"
        />
      }
    >
      {!session ? (
        <>
          <Box w={'full'} minH={'100vh'} bg="white">
            <Box
              alignItems="center"
              justifyContent={'center'}
              flexDir={'column'}
              display={'flex'}
              maxW="32rem"
              minH="60vh"
              mx="auto"
            >
              <Text
                pt={4}
                color="brand.slate.900"
                fontSize={18}
                fontWeight={600}
                textAlign={'center'}
              >
                您只差一步
              </Text>
              <Text
                pb={4}
                color="brand.slate.600"
                fontSize={15}
                fontWeight={400}
                textAlign={'center'}
              >
                就可以加入 Solar Earn
              </Text>
              <SignIn />
            </Box>
          </Box>
        </>
      ) : (
        <VStack w="full" pt={8} pb={24}>
          <VStack>
            <Heading
              color={'gray.700'}
              fontFamily={'var(--font-sans)'}
              fontSize={'24px'}
              fontWeight={700}
            >
              欢迎来到 Solar Earn
            </Heading>
            <Text
              color={'gray.400'}
              fontFamily={'var(--font-sans)'}
              fontSize={'20px'}
              fontWeight={500}
            >
              让我们从您团队的基本信息开始
            </Text>
          </VStack>
          <VStack w={'2xl'} pt={10}>
            <form
              onSubmit={handleSubmit(async (e) => {
                posthog.capture('complete profile_sponsor');
                createNewSponsor({
                  bio: e.bio,
                  industry: industries ?? '',
                  name: sponsorName,
                  slug,
                  logo: imageUrl ?? '',
                  twitter: e.twitterHandle,
                  url: e.sponsorurl ?? '',
                  entityName: e.entityName,
                  telegram: e.telegram,
                  wechat: e.wechat,
                  isActive: false,
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
                    placeholder=" Stark Industries"
                    {...register('sponsorname')}
                    isInvalid={isSponsorNameInvalid}
                    onChange={(e) => setSponsorName(e.target.value)}
                    value={sponsorName}
                  />
                  {isSponsorNameInvalid && (
                    <Text
                      mt={1}
                      color={'red'}
                      fontSize={'sm'}
                      lineHeight={'15px'}
                      letterSpacing={'-1%'}
                    >
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
                    placeholder="starkindustries"
                    {...register('slug')}
                    isInvalid={isInvalid}
                    onChange={(e) => setSlug(e.target.value)}
                    value={slug}
                  />
                  {isInvalid && (
                    <Text
                      mt={1}
                      color={'red'}
                      fontSize={'sm'}
                      lineHeight={'15px'}
                      letterSpacing={'-1%'}
                    >
                      {validationErrorMessage}
                    </Text>
                  )}
                  <FormErrorMessage>
                    {errors.slug ? <>{errors.slug.message}</> : <></>}
                  </FormErrorMessage>
                </FormControl>
              </Flex>
              <HStack justify={'space-between'} w={'full'} my={6}>
                <FormControl w={'full'}>
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
                    placeholder="https://starkindustries.com"
                    {...register('sponsorurl')}
                  />
                  <FormErrorMessage>
                    {errors.sponsorurl ? (
                      <>{errors.sponsorurl.message}</>
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
                    htmlFor={'twitterHandle'}
                  >
                    公司 Twitter
                  </FormLabel>
                  <Input
                    w={'full'}
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    id="twitterHandle"
                    placeholder="@StarkIndustries"
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
                      label="请填写您的项目的官方实体名称。如果您是 DAO，请填写 DAO 的名称。如果您既不是实体也不是 DAO，请填写您的全名。"
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
                    placeholder="全实体名称"
                    {...register('entityName')}
                  />
                  <FormErrorMessage>
                    {errors.entityName ? (
                      <>{errors.entityName.message}</>
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
                      fontWeight={700}
                      htmlFor={'telegram'}
                    >
                      Telegram
                    </FormLabel>
                    <Tooltip
                      fontSize="xs"
                      label="请填写您的官方 Telegram 用户名。"
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
                    id="telegram"
                    placeholder="Telegram 名称"
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
                    <Tooltip fontSize="xs" label="请填写您的官方微信 ID。">
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
                    placeholder="微信 ID"
                    {...register('wechat')}
                  />
                </FormControl>
              </HStack>
              {
                <VStack align={'start'} gap={2} mt={6} mb={3}>
                  <Heading
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                  >
                    公司 logo{' '}
                    <span
                      style={{
                        color: 'red',
                      }}
                    >
                      *
                    </span>
                  </Heading>
                  <HStack gap={5}>
                    <ImagePicker
                      onChange={async (e) => {
                        const a = await uploadToCloudinary(e, 'earn-sponsor');
                        setImageUrl(a);
                      }}
                    />
                  </HStack>
                </VStack>
              }

              <HStack justify={'space-between'} w={'full'} mt={6}>
                <FormControl w={'full'} isRequired>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                    htmlFor={'行业'}
                  ></FormLabel>

                  <Select
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    isMulti
                    options={IndustryList.map((elm: string) => {
                      return { label: elm, value: elm };
                    })}
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
              <Box my={8}>
                {hasError && (
                  <Text align="center" mb={2} color="red">
                    {errorMessage}
                    {(validationErrorMessage ||
                      sponsorNameValidationErrorMessage) &&
                      '公司名称或用户名已经存在。'}
                  </Text>
                )}
                {(validationErrorMessage ||
                  sponsorNameValidationErrorMessage) && (
                  <Text align={'center'} color="yellow.500">
                    如果您想访问现有的帐户，请在 Telegram 上联系我们
                    @cryptosheep1
                  </Text>
                )}
              </Box>
              <Button
                className="ph-no-capture"
                w="full"
                isDisabled={imageUrl === ''}
                isLoading={!!isLoading}
                loadingText="创建中..."
                size="lg"
                type="submit"
                variant="solid"
              >
                创建项目方
              </Button>
            </form>
          </VStack>
        </VStack>
      )}
    </Default>
  );
};

export default CreateSponsor;
