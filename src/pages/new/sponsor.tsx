import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { type FieldValues, useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { IndustryList, PDTG } from '@/constants';
import { SignIn } from '@/features/auth';
import {
  useSlugValidation,
  useSponsorNameValidation,
} from '@/features/sponsor';
import { useUsernameValidation } from '@/features/talent';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

const CreateSponsor = () => {
  const router = useRouter();
  const animatedComponents = makeAnimated();
  const { data: session, status } = useSession();
  const { user, refetchUser } = useUser();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    getValues,
  } = useForm();
  const posthog = usePostHog();

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [pfpUrl, setPfpUrl] = useState<string>('');
  const [industries, setIndustries] = useState<string>();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );

  const {
    setSponsorName,
    isInvalid: isSponsorNameInvalid,
    validationErrorMessage: sponsorNameValidationErrorMessage,
    sponsorName,
  } = useSponsorNameValidation();
  const {
    setSlug,
    isInvalid: isSlugInvalid,
    validationErrorMessage: validationSlugErrorMessage,
    slug,
  } = useSlugValidation();
  const {
    setUsername,
    isInvalid: isUsernameInvalid,
    validationErrorMessage: validationUsernameErrorMessage,
    username,
  } = useUsernameValidation(user?.username);

  useEffect(() => {
    if (user?.photo) {
      setPfpUrl(user?.photo);
    }
    if (user?.username) {
      setUsername(user?.username);
    }
  }, [user]);

  useEffect(() => {
    if (user?.currentSponsorId && session?.user?.role !== 'GOD') {
      router.push('/dashboard/listings?open=1');
    }
  }, [user?.currentSponsorId, router]);

  const {
    mutate: createSponsor,
    isPending,
    isError,
  } = useMutation({
    mutationFn: async (data: FieldValues) => {
      return new Promise(async (resolve, reject) => {
        try {
          const sponsorData = {
            bio: data.bio,
            industry: industries ?? '',
            name: sponsorName,
            slug,
            logo: logoUrl ?? '',
            twitter: data.twitterHandle,
            url: data.sponsorurl ?? '',
            entityName: data.entityName,
          };

          const userData = {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            photo: isGooglePhoto ? user?.photo : pfpUrl,
          };

          const updateUser =
            userData.firstName !== user?.firstName ||
            userData.lastName !== user?.lastName ||
            userData.username !== user?.username ||
            userData.photo !== user?.photo;

          // Step 1: Create sponsor
          await axios.post('/api/sponsors/create', sponsorData);

          // Step 2: Update user details if necessary
          if (updateUser) {
            await axios.post('/api/sponsors/usersponsor-details/', userData);
          }

          // Step 3: Send welcome email
          await axios.post(`/api/email/manual/welcome-sponsor`);

          resolve('Success');
        } catch (error) {
          console.log('Error in createSponsor:', error);
          reject(error);
        }
      });
    },
    onSuccess: async () => {
      await refetchUser();
      router.push('/dashboard/listings?open=1');
    },
    onError: (error) => {
      console.log('Failed to create sponsor', error);
      if (axios.isAxiosError(error)) {
        if (
          (error.response?.data?.error as string)
            ?.toLowerCase()
            ?.includes('unique constraint failed')
        ) {
          setErrorMessage('Sponsor name or username already exists');
          toast.error('Sorry! Sponsor name or username already exists.');
        } else {
          toast.error(
            `Failed to create sponsor: ${error.response?.data?.message || error.message}`,
          );
        }
      } else {
        toast.error('An unexpected error occurred while creating the sponsor.');
      }
    },
  });

  const handleCreateSponsor = async (e: FieldValues) => {
    posthog.capture('complete profile_sponsor');
    if (getValues('bio').length > 180) {
      setErrorMessage('Company short bio length exceeded the limit');
      return;
    }
    createSponsor(e);
  };

  if (!session && status === 'loading') {
    return <></>;
  }

  return (
    <Default
      meta={
        <Meta
          title="Create Sponsor | Superteam Earn"
          description="Every Solana opportunity in one place!"
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
                You&apos;re one step away
              </Text>
              <Text
                pb={4}
                color="brand.slate.600"
                fontSize={15}
                fontWeight={400}
                textAlign={'center'}
              >
                from joining Superteam Earn
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
              Welcome to Superteam Earn
            </Heading>
            <Text
              color={'gray.400'}
              fontFamily={'var(--font-sans)'}
              fontSize={'20px'}
              fontWeight={500}
            >
              {"Let's start with some basic information about your team"}
            </Text>
          </VStack>
          <VStack w={'2xl'} pt={10}>
            <form
              onSubmit={handleSubmit(handleCreateSponsor)}
              style={{ width: '100%' }}
            >
              <Text
                as="h3"
                mb={4}
                color="brand.slate.600"
                fontSize={'xl'}
                fontWeight={600}
              >
                About You
              </Text>

              <Flex justify={'space-between'} gap={2} w={'full'}>
                <FormControl isRequired>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={500}
                    htmlFor={'firstName'}
                  >
                    First Name
                  </FormLabel>

                  <Input
                    color={'gray.800'}
                    borderColor="brand.slate.300"
                    _placeholder={{
                      color: 'brand.slate.400',
                    }}
                    focusBorderColor="brand.purple"
                    id="firstName"
                    placeholder="First Name"
                    {...register('firstName', { required: true })}
                    defaultValue={user?.firstName}
                    maxLength={100}
                  />

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
                    fontWeight={500}
                    htmlFor={'lastName'}
                  >
                    Last Name
                  </FormLabel>
                  <Input
                    color={'gray.800'}
                    borderColor="brand.slate.300"
                    _placeholder={{
                      color: 'brand.slate.400',
                    }}
                    focusBorderColor="brand.purple"
                    id="lastName"
                    placeholder="Last Name"
                    {...register('lastName', { required: true })}
                    defaultValue={user?.lastName}
                    maxLength={100}
                  />
                  <FormErrorMessage>
                    {errors.slug ? <>{errors.slug.message}</> : <></>}
                  </FormErrorMessage>
                </FormControl>
              </Flex>

              <FormControl w={'full'} my={6} isRequired>
                <HStack mb={2}>
                  <FormLabel
                    m={0}
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={500}
                    htmlFor={'username'}
                  >
                    Username
                  </FormLabel>
                </HStack>
                <Input
                  color={'gray.800'}
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.400',
                  }}
                  focusBorderColor="brand.purple"
                  id="username"
                  placeholder="Username"
                  {...register('username', { required: true })}
                  isInvalid={isUsernameInvalid}
                  maxLength={40}
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                />
                {isUsernameInvalid && (
                  <Text color={'red'} fontSize={'sm'}>
                    {validationUsernameErrorMessage}
                  </Text>
                )}
                <FormErrorMessage>
                  {errors.entityName ? <>{errors.entityName.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
              <>
                <FormLabel
                  mb={2}
                  pb={'0'}
                  color={'brand.slate.500'}
                  requiredIndicator={<></>}
                >
                  Profile Picture
                </FormLabel>
                {user?.photo ? (
                  <ImagePicker
                    defaultValue={{ url: user?.photo }}
                    onChange={async (e) => {
                      setIsUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-pfp');
                      setPfpUrl(a);
                      setIsGooglePhoto(false);
                      setIsUploading(false);
                    }}
                    onReset={() => {
                      setPfpUrl('');
                      setIsUploading(false);
                    }}
                  />
                ) : (
                  <ImagePicker
                    onChange={async (e) => {
                      setIsUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-pfp');
                      setPfpUrl(a);
                      if (user?.photo) setIsGooglePhoto(false);
                      setIsUploading(false);
                    }}
                    onReset={() => {
                      setPfpUrl('');
                      setIsUploading(false);
                    }}
                  />
                )}
              </>

              <Divider my={6} borderColor="brand.slate.400" />

              <Text
                as="h3"
                mb={4}
                color="brand.slate.600"
                fontSize={'xl'}
                fontWeight={600}
              >
                About Your Company
              </Text>
              <Flex justify={'space-between'} gap={2} w={'full'}>
                <FormControl isRequired>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={500}
                    htmlFor={'sponsorname'}
                  >
                    Company Name
                  </FormLabel>
                  <Input
                    w={'full'}
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    focusBorderColor="brand.purple"
                    id="sponsorname"
                    placeholder="Stark Industries"
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
                    fontWeight={500}
                    htmlFor={'slug'}
                  >
                    Company Username
                  </FormLabel>
                  <Input
                    w={'full'}
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    focusBorderColor="brand.purple"
                    id="slug"
                    placeholder="starkindustries"
                    {...register('slug')}
                    isInvalid={isSlugInvalid}
                    onChange={(e) => setSlug(e.target.value)}
                    value={slug}
                  />
                  {isSlugInvalid && (
                    <Text
                      mt={1}
                      color={'red'}
                      fontSize={'sm'}
                      lineHeight={'15px'}
                      letterSpacing={'-1%'}
                    >
                      {validationSlugErrorMessage}
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
                    fontWeight={500}
                    htmlFor={'sponsorname'}
                  >
                    Company URL
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
                    fontWeight={500}
                    htmlFor={'twitterHandle'}
                  >
                    Company Twitter
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
              <HStack w="full">
                <FormControl w={'full'} isRequired>
                  <HStack mb={2}>
                    <FormLabel
                      m={0}
                      color={'brand.slate.500'}
                      fontSize={'15px'}
                      fontWeight={500}
                      htmlFor={'entityName'}
                    >
                      Entity Name
                    </FormLabel>
                    <Tooltip
                      fontSize="xs"
                      label="Please mention the official entity name of your project. If you are a DAO, simply mention the name of the DAO. If you neither have an entity nor are a DAO, mention your full name."
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
                    placeholder="Full Entity Name"
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
              <VStack align={'start'} gap={2} w="full" mt={6} mb={3}>
                <Heading
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={500}
                >
                  Company Logo{' '}
                  <span
                    style={{
                      color: 'red',
                    }}
                  >
                    *
                  </span>
                </Heading>
                <HStack gap={5} w="full">
                  <ImagePicker
                    onChange={async (e) => {
                      setIsUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-sponsor');
                      setLogoUrl(a);
                      setIsUploading(false);
                    }}
                  />
                </HStack>
              </VStack>

              <HStack justify={'space-between'} w={'full'} mt={6}>
                <FormControl w={'full'} isRequired>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={500}
                    htmlFor={'industry'}
                  >
                    Industry
                  </FormLabel>

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
                    fontWeight={500}
                    htmlFor={'bio'}
                  >
                    Company Short Bio
                  </FormLabel>
                  <Input
                    w={'full'}
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    focusBorderColor="brand.purple"
                    id="bio"
                    maxLength={180}
                    {...register('bio')}
                    placeholder="What does your company do?"
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
                    {180 - (watch('bio')?.length || 0)} characters left
                  </Text>
                  <FormErrorMessage>
                    {errors.bio ? <>{errors.bio.message}</> : <></>}
                  </FormErrorMessage>
                </FormControl>
              </Box>
              <Box my={8}>
                {isError && (
                  <Text align="center" mb={2} color="red">
                    {errorMessage}
                    {(validationSlugErrorMessage ||
                      sponsorNameValidationErrorMessage) &&
                      'Company name/username already exists.'}
                  </Text>
                )}
                {(validationSlugErrorMessage ||
                  sponsorNameValidationErrorMessage) && (
                    <Text align={'center'} color="yellow.500">
                      If you want access to the existing account, contact us on
                      Telegram at{' '}
                      <Link href={PDTG} isExternal>
                        @cryptosheep1
                      </Link>
                    </Text>
                  )}
              </Box>
              <Button
                className="ph-no-capture"
                w="full"
                isDisabled={logoUrl === ''}
                isLoading={!!isUploading || !!isPending}
                loadingText="Creating..."
                size="lg"
                type="submit"
                variant="solid"
              >
                Create Sponsor
              </Button>
            </form>
          </VStack>
        </VStack>
      )}
    </Default>
  );
};

export default CreateSponsor;
