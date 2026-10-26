'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploader } from '@/components/shared/ImageUploader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { JTTG } from '@/constants/Telegram';
import { postJson, RequestError } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';

import { SocialInput } from '@/features/social/components/SocialInput';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { useSlugValidation } from '@/features/sponsor/hooks/useSlugValidation';
import { useSponsorNameValidation } from '@/features/sponsor/hooks/useSponsorNameValidation';
import { useUsernameValidation } from '@/features/sponsor/hooks/useUsernameValidation';
import {
  shouldUpdateUser,
  sponsorFormSchema,
  type SponsorFormValues,
  transformFormToApiData,
} from '@/features/sponsor/utils/sponsorFormSchema';
import { IndustryList, ONBOARDING_KEY } from '@/features/talent/constants';

import { LocationCombobox } from './LocationCombobox';

// /earn/new/sponsor/'s form, for a signed-in account without a sponsor (or
// in God mode): about them, then about their company.
export function CreateSponsorForm() {
  const router = useRouter();
  const user = useViewer();
  const [uploadedUserPhotoUrl, setUploadedUserPhotoUrl] = useState<
    string | null
  >(null);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [acknowledgementAccepted, setAcknowledgementAccepted] = useState(false);
  const [acknowledgementError, setAcknowledgementError] = useState('');

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
        location: '',
      },
      user: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        photo: user?.photo || '',
        telegram: user?.telegram
          ? extractSocialUsername('telegram', user.telegram) || user.telegram
          : '',
      },
    },
  });
  const bio = useWatch({ control: form.control, name: 'sponsor.bio' });

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
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Earn's form effects, run on these alone
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Earn's form effects, run on these alone
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
  } = useUsernameValidation(user?.username ?? undefined);
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- Earn's form effects, run on these alone
  }, [
    validationUsernameErrorMessage,
    isUsernameInvalid,
    form.formState.errors.user?.username?.message,
    username,
  ]);

  const createSponsor = async (data: SponsorFormValues) => {
    setIsPending(true);
    setIsError(false);
    try {
      router.prefetch('/earn/dashboard/listings/?open=1');

      if (uploadedUserPhotoUrl && data.user) {
        data.user.photo = uploadedUserPhotoUrl;
      }

      const { sponsorData, userData } = transformFormToApiData(data);

      try {
        if (uploadedLogoUrl) {
          sponsorData.logo = uploadedLogoUrl;
        }

        await postJson('/api/sponsors/create/', sponsorData);

        if (userData && shouldUpdateUser(userData, user)) {
          await postJson('/api/sponsors/usersponsor-details/', userData);
        }

        await postJson('/api/email/manual/welcome-sponsor/');

        localStorage.removeItem(ONBOARDING_KEY);
      } catch (error) {
        console.error('Error in createSponsor:', error);
        throw error;
      }

      toast.success('Your Sponsor has been created!', {
        description: 'Redirecting to dashboard...',
      });
      router.push('/earn/dashboard/listings/?open=1');
    } catch (error) {
      setIsError(true);
      setIsPending(false);
      console.error('Failed to create sponsor', error);
      if (error instanceof RequestError) {
        if (error.status === 409) {
          setErrorMessage('Sponsor name or username already exists');
          toast.error('Sorry! Sponsor name or username already exists.');
        } else {
          const body: unknown = error.body;
          const message =
            typeof body === 'object' &&
            body !== null &&
            'message' in body &&
            typeof body.message === 'string'
              ? body.message
              : '';
          toast.error(`Failed to create sponsor: ${message || error.message}`);
        }
      } else {
        toast.error('An unexpected error occurred while creating the sponsor.');
      }
      throw error;
    }
  };

  const isSubmitDisabled = useMemo(
    () =>
      !uploadedLogoUrl ||
      isPending ||
      isSlugInvalid ||
      isUsernameInvalid ||
      isSponsorNameInvalid,
    [
      uploadedLogoUrl,
      isPending,
      isSlugInvalid,
      isUsernameInvalid,
      isSponsorNameInvalid,
    ],
  );

  const validateAcknowledgement = (): boolean => {
    if (!acknowledgementAccepted) {
      setAcknowledgementError('Acknowledgement required');
      return false;
    }
    setAcknowledgementError('');
    return true;
  };

  const onSubmit = async (data: SponsorFormValues) => {
    if (!validateAcknowledgement()) return;
    if (isSubmitDisabled) return;

    try {
      posthog.capture('complete profile_sponsor');
      await createSponsor(data);
      if (user) posthog.identify(user.email);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to create sponsor. Please try again.');
    }
  };

  return (
    <div className="flex w-full flex-col items-center px-4 pt-8 pb-24">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Welcome to Superteam Earn
        </h1>
        <p className="text-lg font-normal text-gray-600">
          Let&apos;s start with some basic information about your team
        </p>
      </div>
      <div className="flex flex-col pt-10 md:w-[42rem]">
        <Form {...form}>
          <form
            onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
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
            <div className="mb-4 flex w-full justify-between gap-2">
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
              <SocialInput
                name="user.telegram"
                socialName={'telegram'}
                formLabel="Telegram"
                placeholder="solanalabs"
                required
                control={form.control}
                height="h-9"
              />
            </div>
            <>
              <FormLabel isRequired>Profile Picture</FormLabel>
              <ImageUploader
                source="user"
                defaultValue={user?.photo || undefined}
                onChange={(result) => {
                  setUploadedUserPhotoUrl(result.secureUrl);
                  form.setValue('user.photo', result.secureUrl);
                }}
                onReset={() => {
                  setUploadedUserPhotoUrl(null);
                  form.setValue('user.photo', '');
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
                <Input placeholder="Solana Labs" value={sponsorName} />
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
                <Input placeholder="solanalabs" value={slug} />
              </FormFieldWrapper>
            </div>
            <div className="my-6 flex w-full justify-between gap-4">
              <FormFieldWrapper
                control={form.control}
                name="sponsor.url"
                label="Company URL"
                isRequired
              >
                <Input placeholder="https://solanalabs.com" />
              </FormFieldWrapper>

              <div className="hidden w-full md:flex">
                <SocialInput
                  name="sponsor.twitter"
                  socialName={'twitter'}
                  formLabel="Company X"
                  placeholder="solanalabs"
                  required
                  control={form.control}
                  height="h-9"
                />
              </div>
            </div>
            <div className="my-6 flex w-full md:hidden">
              <SocialInput
                name="sponsor.twitter"
                socialName={'twitter'}
                formLabel="Company X"
                placeholder="@solanalabs"
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
                      <Info className="mt-1 ml-1 hidden h-3 w-3 text-slate-500 md:block" />
                    </Tooltip>
                  </>
                }
                isRequired
              >
                <Input placeholder="Full Entity Name" />
              </FormFieldWrapper>
            </div>
            <div className="mt-6 w-full">
              <FormField
                control={form.control}
                name="sponsor.location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel isRequired>Company Location</FormLabel>
                    <FormControl>
                      <LocationCombobox
                        className="h-9 w-full"
                        excludeSanctioned
                        placeholder="Where is your team based?"
                        value={field.value}
                        onChange={field.onChange}
                        classNames={{
                          popoverContent:
                            'w-[var(--radix-popper-anchor-width)]',
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-6 mb-3 w-full">
              <FormLabel isRequired>Company Logo</FormLabel>
              <ImageUploader
                source="sponsor"
                crop="square"
                onChange={(result) => {
                  setUploadedLogoUrl(result.secureUrl);
                  form.setValue('sponsor.logo', result.secureUrl);
                }}
                onReset={() => {
                  setUploadedLogoUrl(null);
                  form.setValue('sponsor.logo', '');
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
                        onChange={(selected: { value: string }[]) => {
                          const values =
                            selected?.map((item) => item.value) || [];
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
                {180 - (bio?.length || 0)} characters left
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
                  <Link href={JTTG} target="_blank">
                    @jilltodkar
                  </Link>
                </p>
              )}
            </div>
            <div className="my-6 flex flex-col gap-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acknowledgement"
                  className="data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple mt-1"
                  checked={acknowledgementAccepted}
                  onCheckedChange={(checked) => {
                    setAcknowledgementAccepted(checked === true);
                    if (checked) {
                      setAcknowledgementError('');
                    }
                  }}
                />
                <label
                  htmlFor="acknowledgement"
                  className="text-xs text-slate-500"
                >
                  I understand and acknowledge that this project is built on, or
                  supports, the Solana blockchain, and that Superteam Earn is a
                  platform exclusively for teams and projects within the Solana
                  ecosystem.
                  <span className="text-red-500">*</span>
                </label>
              </div>
              {acknowledgementError && (
                <FormMessage>{acknowledgementError}</FormMessage>
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
              {isPending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </span>
              ) : (
                <span>Create Sponsor</span>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
