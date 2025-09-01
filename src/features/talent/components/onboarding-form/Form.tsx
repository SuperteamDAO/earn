import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useEffect, useMemo, useState } from 'react';
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
import { useUploadImage } from '@/hooks/use-upload-image';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import {
  type NewTalentFormData,
  newTalentSchema,
  socialSuperRefine,
} from '@/features/talent/schema';

import { LocationField } from './fields/Location';
import { SkillsField } from './fields/Skills';
import { SocialsField } from './fields/Socials';
import { UsernameField } from './fields/Username';
export const TalentForm = () => {
  const router = useRouter();
  const { user, refetchUser } = useUser();
  const { uploadAndReplace, uploading } = useUploadImage();

  const form = useForm<NewTalentFormData>({
    resolver: zodResolver(
      newTalentSchema.superRefine((data, ctx) => socialSuperRefine(data, ctx)),
    ),
    mode: 'onBlur',
  });
  const {
    control,
    formState: { errors },
    setValue,
    reset,
  } = form;

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );
  const [skillsRefreshKey, setSkillsRefreshKey] = useState<number>(0);
  const [isUsernameValidating, setUsernameValidating] = useState(false);

  const [referralCode, setReferralCode] = useState<string>('');
  const [isReferralValid, setIsReferralValid] = useState<boolean | null>(null);
  const [isReferralChecking, setIsReferralChecking] = useState<boolean>(false);

  useEffect(() => {
    if (!referralCode) {
      setIsReferralValid(null);
      return;
    }
    setIsReferralChecking(true);
    let ignore = false;
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get('/api/user/referral/verify', {
          params: { code: referralCode },
        });
        if (!ignore) setIsReferralValid(!!res.data?.valid);
      } catch {
        if (!ignore) setIsReferralValid(false);
      } finally {
        if (!ignore) setIsReferralChecking(false);
      }
    }, 400);
    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [referralCode]);

  const handleReferralCodeChange = (value: string): void => {
    const next = value.toUpperCase();
    setReferralCode(next);
  };

  useEffect(() => {
    if (user) {
      reset({
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        skills: newTalentSchema.shape.skills.safeParse(user?.skills).data,
        photo: user?.photo,
        location: newTalentSchema.shape.location.safeParse(user?.location).data,
        discord: user.discord || undefined,
        github: extractSocialUsername('github', user.github || '') || undefined,
        twitter:
          extractSocialUsername('twitter', user.twitter || '') || undefined,
        linkedin:
          extractSocialUsername('linkedin', user.linkedin || '') || undefined,
        telegram:
          extractSocialUsername('telegram', user.telegram || '') || undefined,
        website: user.website || undefined,
      });
      setSkillsRefreshKey((s) => s + 1);
    }
  }, [user, setValue]);

  const isForcedRedirect = useMemo(() => {
    return router.query.type === 'forced';
  }, [router, user]);

  const TitleArray = {
    title: isForcedRedirect ? 'Finish Your Profile' : 'Complete your Profile',
    subTitle: isForcedRedirect
      ? 'It takes less than a minute to start earning in global standards. '
      : 'We’ll tailor your Earn experience based on your profile',
  };

  const isSubmitDisabled = useMemo(() => {
    return isLoading || isUsernameValidating || uploading;
  }, [isLoading, isUsernameValidating, uploading]);

  const onSubmit = async (data: NewTalentFormData) => {
    if (isSubmitDisabled) return false;
    if (errors.username?.message) {
      form.setFocus('username');
      return;
    }

    setisLoading(true);
    posthog.capture('finish profile_talent');

    return toast.promise(
      async () => {
        try {
          let photoUrl = user?.photo;

          if (selectedPhoto && !isGooglePhoto) {
            const uploadResult = await uploadAndReplace(
              selectedPhoto,
              { folder: 'earn-pfp' },
              user?.photo || undefined,
            );
            photoUrl = uploadResult.url;
          } else if (isGooglePhoto) {
            photoUrl = user?.photo;
          }

          await api.post('/api/user/complete-profile/', {
            ...data,
            referralCode: referralCode || undefined,
            photo: photoUrl,
          });
          if (user) posthog.identify(user.email);

          await refetchUser();
          return true;
        } catch (error) {
          console.error('Error:', error);
          throw error;
        } finally {
          setisLoading(false);
        }
      },
      {
        loading: 'Creating your profile...',
        success: 'Your profile has been created successfully!',
        error: 'Failed to create your profile.',
      },
    );
  };

  return (
    <div className="">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <div className="mt-4 mb-3 flex flex-col text-left sm:mb-4 2xl:mt-8">
            <h1 className="font-sans text-lg font-medium md:text-2xl">
              {TitleArray?.title}
            </h1>
            <p className="text-base text-slate-500 md:text-lg">
              {TitleArray?.subTitle}
            </p>
          </div>
          <div className="mb-3 flex items-start gap-4 sm:mb-4">
            <FormField
              name="photo"
              control={control}
              render={({ field }) => (
                <FormItem className="mt-auto w-fit">
                  <FormLabel className="sr-only">Profile Picture</FormLabel>
                  <FormControl>
                    <ImagePicker
                      variant="short"
                      defaultValue={
                        field.value ? { url: field.value } : undefined
                      }
                      onChange={async (file, previewUrl) => {
                        setSelectedPhoto(file);
                        setIsGooglePhoto(false);
                        field.onChange(previewUrl);
                      }}
                      onReset={() => {
                        setSelectedPhoto(null);
                        setIsGooglePhoto(false);
                        field.onChange('');
                      }}
                    />
                  </FormControl>
                  <FormMessage className="mt-1" />
                </FormItem>
              )}
            />
            <FormFieldWrapper
              label="First Name"
              name="firstName"
              control={control}
              isRequired
              className="gap-1 sm:gap-2"
            >
              <Input maxLength={100} placeholder="First Name" />
            </FormFieldWrapper>
            <FormFieldWrapper
              label="Last Name"
              name="lastName"
              control={control}
              isRequired
              className="gap-1 sm:gap-2"
            >
              <Input maxLength={100} placeholder="Last Name" />
            </FormFieldWrapper>
          </div>

          <div className="flex flex-col md:flex-row md:gap-2">
            <UsernameField setUsernameValidating={setUsernameValidating} />
            <LocationField />
          </div>

          <SkillsField skillsRefreshKey={skillsRefreshKey} />
          <SocialsField />

          {!user?.referredById && (
            <div className="mt-6 flex w-full items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Have a Referral Code?</p>
              <div className="relative w-32">
                <Input
                  placeholder="Enter code"
                  value={referralCode}
                  onChange={(e) => handleReferralCodeChange(e.target.value)}
                  className="pr-9"
                  maxLength={10}
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                />
                {referralCode && isReferralChecking && (
                  <Loader2 className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                )}
                {referralCode &&
                  !isReferralChecking &&
                  isReferralValid === true && (
                    <Check className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  )}
                {referralCode &&
                  !isReferralChecking &&
                  isReferralValid === false && (
                    <XCircle className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                  )}
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="mt-5 mb-12 w-full sm:mt-8"
            disabled={isSubmitDisabled}
          >
            Create Profile
          </Button>
        </form>
      </Form>
    </div>
  );
};
