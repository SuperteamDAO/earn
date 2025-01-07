import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { PDTG } from '@/constants/Telegram';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { uploadToCloudinary } from '@/utils/upload';

import { SignIn } from '@/features/auth/components/SignIn';
import { SocialInput } from '@/features/social/components/SocialInput';
import { useSlugValidation } from '@/features/sponsor/hooks/useSlugValidation';
import { useSponsorNameValidation } from '@/features/sponsor/hooks/useSponsorNameValidation';
import {
  shouldUpdateUser,
  sponsorFormSchema,
  type SponsorFormValues,
  transformFormToApiData,
} from '@/features/sponsor/utils/sponsorFormSchema';
import { IndustryList, ONBOARDING_KEY } from '@/features/talent/constants';
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

const CreateSponsor = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, refetchUser } = useUser();
  const posthog = usePostHog();

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loginStep, setLoginStep] = useState(0);

  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorFormSchema),
    mode: 'onBlur',
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

  useEffect(() => {
    if (user) {
      user.username && setUsername(user.username);
      form.reset({
        user: {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          username: user?.username || '',
          photo: user?.photo || '',
        },
      });
    }
  }, [user]);

  const {
    setSponsorName,
    isInvalid: isSponsorNameInvalid,
    validationErrorMessage: sponsorNameValidationErrorMessage,
    sponsorName,
  } = useSponsorNameValidation();
  useEffect(() => {
    if (form.formState.touchedFields.sponsor?.name && sponsorName === '') {
      form.setError('sponsor.name', {
        message: 'Company Name is required',
      });
      return;
    }
    form.clearErrors('sponsor.name');
    if (isSponsorNameInvalid && !form.formState.errors.sponsor?.name?.message) {
      form.setError('sponsor.name', {
        message: sponsorNameValidationErrorMessage,
      });
    }
  }, [
    sponsorNameValidationErrorMessage,
    isSponsorNameInvalid,
    form.formState.errors.sponsor?.name?.message,
    sponsorName,
  ]);

  const {
    setSlug,
    isInvalid: isSlugInvalid,
    validationErrorMessage: validationSlugErrorMessage,
    slug,
  } = useSlugValidation();
  useEffect(() => {
    if (form.formState.touchedFields.sponsor?.slug && slug === '') {
      form.setError('sponsor.slug', {
        message: 'Company Username is required',
      });
      return;
    }
    form.clearErrors('sponsor.slug');
    if (isSlugInvalid && !form.formState.errors.sponsor?.slug?.message) {
      form.setError('sponsor.slug', {
        message: validationSlugErrorMessage,
      });
    }
  }, [
    validationSlugErrorMessage,
    isSlugInvalid,
    form.formState.errors.sponsor?.slug?.message,
    slug,
  ]);

  const {
    setUsername,
    isInvalid: isUsernameInvalid,
    validationErrorMessage: validationUsernameErrorMessage,
    username,
  } = useUsernameValidation(user?.username);
  useEffect(() => {
    if (form.formState.touchedFields.user?.username && username === '') {
      form.setError('user.username', {
        message: 'Username is required',
      });
      return;
    }
    form.clearErrors('user.username');
    if (isUsernameInvalid && !form.formState.errors.user?.username?.message) {
      form.setError('user.username', {
        message: validationUsernameErrorMessage,
      });
    }
  }, [
    validationUsernameErrorMessage,
    isUsernameInvalid,
    form.formState.errors.user?.username?.message,
    username,
  ]);

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
        await api.post('/api/sponsors/create', sponsorData);

        if (userData && shouldUpdateUser(userData, user)) {
          await api.post('/api/sponsors/usersponsor-details/', userData);
        }

        await api.post('/api/email/manual/welcome-sponsor');

        localStorage.removeItem(ONBOARDING_KEY);
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

  const isSubmitDisabled = useMemo(
    () =>
      !logoUrl ||
      isUploading ||
      isPending ||
      isSlugInvalid ||
      isUsernameInvalid ||
      isSponsorNameInvalid,
    [
      logoUrl,
      isUploading,
      isPending,
      isSlugInvalid,
      isUsernameInvalid,
      isSponsorNameInvalid,
    ],
  );

  const onSubmit = (data: SponsorFormValues) => {
    if (isSubmitDisabled) return;
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
      {status === 'unauthenticated' ? (
        <div className="min-h-screen w-full bg-white">
          <div className="mx-auto flex min-h-[60vh] max-w-[32rem] flex-col items-center justify-center">
            <p className="pt-4 text-center text-2xl font-semibold text-slate-900">
              You&apos;re one step away
            </p>
            <p className="pb-4 text-center text-xl font-normal text-slate-600">
              from joining Superteam Earn
            </p>
            <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center px-4 pb-24 pt-8">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Welcome to Superteam Earn
            </h1>
            <p className="text-lg font-normal text-gray-600" color="gray.600">
              Let&apos;s start with some basic information about your team
            </p>
          </div>
          <div className="flex flex-col pt-10 md:w-[42rem]">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                style={{ width: '100%' }}
              >
                <h2 className="mb-5 text-xl font-semibold tracking-tight text-gray-900">
                  About You
                </h2>

                <div className="mb-4 flex w-full justify-between gap-2">
                  <FormFieldWrapper
                    control={form.control}
                    name="user.firstName"
                    label="First Name"
                    isRequired
                  >
                    <Input placeholder="First Name" />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    control={form.control}
                    name="user.lastName"
                    label="Last Name"
                    isRequired
                  >
                    <Input placeholder="Last Name" />
                  </FormFieldWrapper>
                </div>
                <div className="mb-4 flex">
                  <FormFieldWrapper
                    control={form.control}
                    name="user.username"
                    label="Username"
                    isRequired
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-');
                      setUsername(value);
                      form.setValue('user.username', value);
                    }}
                  >
                    <Input placeholder="Username" value={username} />
                  </FormFieldWrapper>
                </div>
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

                <Separator className="my-12 text-slate-400" />

                <h2 className="mb-5 text-xl font-semibold tracking-tight text-gray-900">
                  About Your Company
                </h2>
                <div className="flex w-full justify-between gap-4">
                  <FormFieldWrapper
                    control={form.control}
                    name="sponsor.name"
                    label="Company Name"
                    isRequired
                    onChange={(e) => {
                      setSponsorName(e.target.value);
                    }}
                  >
                    <Input placeholder="Stark Industries" value={sponsorName} />
                  </FormFieldWrapper>
                  <FormFieldWrapper
                    control={form.control}
                    name="sponsor.slug"
                    label="Company Username"
                    isRequired
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-');
                      setSlug(value);
                      form.setValue('sponsor.slug', value);
                    }}
                  >
                    <Input placeholder="starkindustries" value={slug} />
                  </FormFieldWrapper>
                </div>
                <div className="my-6 flex w-full justify-between gap-4">
                  <FormFieldWrapper
                    control={form.control}
                    name="sponsor.url"
                    label="Company URL"
                    isRequired
                  >
                    <Input placeholder="https://starkindustries.com" />
                  </FormFieldWrapper>

                  <SocialInput
                    name="sponsor.twitter"
                    socialName={'twitter'}
                    formLabel="Company Twitter"
                    placeholder="@StarkIndustries"
                    required
                    control={form.control}
                    height="h-9"
                  />
                </div>
                <div className="flex w-full">
                  <FormFieldWrapper
                    control={form.control}
                    name="sponsor.entityName"
                    label={
                      <>
                        Entity Name
                        <Tooltip
                          content="Please mention the official entity name of your project. If you are a DAO, simply mention the name of the DAO. If you neither have an entity nor are a DAO, mention your full name."
                          contentProps={{ className: 'max-w-xs text-xs' }}
                        >
                          <Info className="ml-1 mt-1 hidden h-3 w-3 text-slate-500 md:block" />
                        </Tooltip>
                      </>
                    }
                    isRequired
                  >
                    <Input placeholder="Full Entity Name" />
                  </FormFieldWrapper>
                </div>
                <div className="mb-3 mt-6 w-full">
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
                </div>

                <div className="mt-6 flex w-full justify-between">
                  <FormField
                    control={form.control}
                    name="sponsor.industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired>Industry</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={IndustryList.map((elm) => ({
                              label: elm,
                              value: elm,
                            }))}
                            onChange={(selected: any) => {
                              const values =
                                selected?.map((item: any) => item.value) || [];
                              field.onChange(values.join(', '));
                            }}
                            className="mt-2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="my-6">
                  <FormFieldWrapper
                    control={form.control}
                    name="sponsor.bio"
                    label="Company Short Bio"
                    isRequired
                  >
                    <Input
                      maxLength={180}
                      placeholder="What does your company do?"
                    />
                  </FormFieldWrapper>
                  <div className="text-right text-xs text-slate-400">
                    {180 - (form.watch('sponsor.bio')?.length || 0)} characters
                    left
                  </div>
                </div>
                <div className="my-6">
                  {isError && (
                    <p className="mb-2 text-center text-red-500">
                      {errorMessage}
                      {(validationSlugErrorMessage ||
                        sponsorNameValidationErrorMessage) &&
                        'Company name/username already exists.'}
                    </p>
                  )}
                  {sponsorNameValidationErrorMessage && (
                    <p className="text-center text-yellow-500">
                      If you want access to the existing account, contact us on
                      Telegram at{' '}
                      <Link href={PDTG} target="_blank">
                        @pratikdholani
                      </Link>
                    </p>
                  )}
                </div>
                <Button
                  className={cn(
                    'ph-no-capture h-11 w-full',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  disabled={isSubmitDisabled}
                  type="submit"
                >
                  {isUploading || isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sponsor'
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </Default>
  );
};

export default CreateSponsor;
