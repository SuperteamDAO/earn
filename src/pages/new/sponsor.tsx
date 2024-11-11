import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  Heading,
  HStack,
  Input,
  Link,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { IndustryList, PDTG } from '@/constants';
import { SignIn } from '@/features/auth';
import {
  shouldUpdateUser,
  sponsorFormSchema,
  type SponsorFormValues,
  transformFormToApiData,
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
  const posthog = usePostHog();

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loginStep, setLoginStep] = useState(0);

  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorFormSchema),
    defaultValues: {
      sponsor: {
        name: '',
        slug: '',
        bio: '',
        logo: '',
        industry: '',
        url: '',
        twitter: '',
        entityName: '',
      },
      user: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        photo: user?.photo || '',
      },
    },
  });

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
      form.setValue('user.photo', user.photo);
    }
    if (user?.username) {
      setUsername(user.username);
      form.setValue('user.username', user.username);
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
    mutationFn: async (data: SponsorFormValues) => {
      const { sponsorData, userData } = transformFormToApiData(data);

      try {
        await axios.post('/api/sponsors/create', sponsorData);

        if (userData && shouldUpdateUser(userData, user)) {
          await axios.post('/api/sponsors/usersponsor-details/', userData);
        }

        await axios.post('/api/email/manual/welcome-sponsor');

        return 'Success';
      } catch (error) {
        console.error('Error in createSponsor:', error);
        throw error;
      }
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

  const onSubmit = (data: SponsorFormValues) => {
    posthog.capture('complete profile_sponsor');
    createSponsor(data);
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
              <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
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

                <Flex justify={'space-between'} gap={2} w={'full'} mb={4}>
                  <FormField
                    control={form.control}
                    name="user.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="user.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Flex>
                <Flex mb={4}>
                  <FormField
                    control={form.control}
                    name="user.username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Username"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setUsername(e.target.value);
                            }}
                            value={username}
                          />
                        </FormControl>
                        {isUsernameInvalid && (
                          <p className="text-sm text-red-500">
                            {validationUsernameErrorMessage}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Flex>
                <>
                  <FormLabel isRequired>Profile Picture</FormLabel>
                  <ImagePicker
                    defaultValue={user?.photo ? { url: user.photo } : undefined}
                    onChange={async (e) => {
                      setIsUploading(true);
                      const url = await uploadToCloudinary(e, 'earn-pfp');
                      form.setValue('user.photo', url);
                      setIsUploading(false);
                    }}
                    onReset={() => {
                      form.setValue('user.photo', '');
                      setIsUploading(false);
                    }}
                  />
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
                  <FormField
                    control={form.control}
                    name="sponsor.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Stark Industries"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setSponsorName(e.target.value);
                            }}
                            value={sponsorName}
                          />
                        </FormControl>
                        {isSponsorNameInvalid && (
                          <p className="text-sm text-red-500">
                            {sponsorNameValidationErrorMessage}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sponsor.slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Company Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="starkindustries"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setSlug(e.target.value);
                            }}
                            value={slug}
                          />
                        </FormControl>
                        {isSlugInvalid && (
                          <p className="text-sm text-red-500">
                            {validationSlugErrorMessage}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Flex>
                <HStack justify={'space-between'} w={'full'} my={6}>
                  <FormField
                    control={form.control}
                    name="sponsor.url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://starkindustries.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sponsor.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Company Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="@StarkIndustries" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </HStack>
                <HStack w="full">
                  <FormField
                    control={form.control}
                    name="sponsor.entityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          isRequired
                          className="flex items-center gap-2"
                        >
                          Entity Name
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
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Full Entity Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </HStack>
                <VStack align={'start'} gap={2} w="full" mt={6} mb={3}>
                  <FormLabel isRequired>Company Logo</FormLabel>
                  <ImagePicker
                    onChange={async (e) => {
                      setIsUploading(true);
                      const url = await uploadToCloudinary(e, 'earn-sponsor');
                      setLogoUrl(url);
                      form.setValue('sponsor.logo', url);
                      setIsUploading(false);
                    }}
                  />
                </VStack>

                <HStack justify={'space-between'} w={'full'} mt={6}>
                  <FormField
                    control={form.control}
                    name="sponsor.industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Industry</FormLabel>
                        <FormControl>
                          <Select
                            closeMenuOnSelect={false}
                            components={animatedComponents}
                            isMulti
                            options={IndustryList.map((elm: string) => ({
                              label: elm,
                              value: elm,
                            }))}
                            onChange={(selected) => {
                              const values = selected.map(
                                (item: any) => item.value,
                              );
                              field.onChange(values.join(', '));
                            }}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </HStack>
                <Box my={6}>
                  <FormField
                    control={form.control}
                    name="sponsor.bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Company Short Bio</FormLabel>
                        <FormControl>
                          <Input
                            maxLength={180}
                            placeholder="What does your company do?"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-right text-xs text-slate-400">
                          {180 - (field.value?.length || 0)} characters left
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        @pratikdholani
                      </Link>
                    </Text>
                  )}
                </Box>
                <Button
                  className="ph-no-capture"
                  w="full"
                  disabled={!logoUrl || isUploading}
                  isLoading={!!isUploading || !!isPending}
                  loadingText="Creating..."
                  size="lg"
                  type="submit"
                  variant="solid"
                >
                  Create Sponsor
                </Button>
              </form>
            </Form>
          </VStack>
        </VStack>
      )}
    </Default>
  );
};

export default CreateSponsor;
