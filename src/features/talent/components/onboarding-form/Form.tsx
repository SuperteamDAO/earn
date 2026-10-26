'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploader } from '@/components/shared/ImageUploader';
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
import { postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';

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
interface TalentFormProps {
  // Picked on the server for someone without a username yet.
  suggestedUsername: string | null;
  // Where the request came from, to start the location there.
  countryCode: string | null;
}

export const TalentForm = ({
  suggestedUsername,
  countryCode,
}: TalentFormProps) => {
  const router = useRouter();
  const params = useSearchParams();
  const user = useViewer();

  const form = useForm<NewTalentFormData>({
    resolver: zodResolver(
      newTalentSchema.superRefine(
        (data, ctx) => void socialSuperRefine(data, ctx),
      ),
    ),
    mode: 'onBlur',
  });
  const {
    control,
    formState: { errors },
    getValues,
    reset,
  } = form;

  const [isLoading, setisLoading] = useState<boolean>(false);
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState<number>(0);
  const [isUsernameValidating, setUsernameValidating] = useState(false);

  useEffect(() => {
    if (user) {
      const currentLocation = getValues('location');
      const userLocation = newTalentSchema.shape.location.safeParse(
        user?.location,
      ).data;

      reset({
        username: user?.username ?? undefined,
        firstName: user?.firstName ?? undefined,
        lastName: user?.lastName ?? undefined,
        skills: newTalentSchema.shape.skills.safeParse(user?.skills).data,
        photo: user?.photo,
        location: userLocation || currentLocation,
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
      // oxlint-disable-next-line react/set-state-in-effect -- kept as Earn runs it
      setSkillsRefreshKey((s) => s + 1);
    }
  }, [user, getValues, reset]);

  const isForcedRedirect = useMemo(() => {
    return params?.get('type') === 'forced';
  }, [params]);

  const TitleArray = {
    title: isForcedRedirect ? 'Finish Your Profile' : 'Complete your Profile',
    subTitle: isForcedRedirect
      ? 'It takes less than a minute to start earning in global standards. '
      : 'We’ll tailor your Earn experience based on your profile',
  };

  const isSubmitDisabled = useMemo(() => {
    return isLoading || isUsernameValidating;
  }, [isLoading, isUsernameValidating]);

  const onSubmit = async (data: NewTalentFormData) => {
    if (isSubmitDisabled) return false;
    if (errors.username?.message) {
      form.setFocus('username');
      return false;
    }

    setisLoading(true);
    posthog.capture('finish profile_talent');

    return toast.promise(
      async () => {
        try {
          const photoUrl =
            uploadedPhotoUrl || (isGooglePhoto ? user?.photo : data.photo);

          await postJson('/api/user/complete-profile/', {
            ...data,
            photo: photoUrl,
          });
          if (user) posthog.identify(user.email);

          // The page sees the finished profile and sends them on.
          router.refresh();
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
        <form
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          style={{ width: '100%' }}
        >
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
                    <ImageUploader
                      source="user"
                      variant="avatar"
                      defaultValue={field.value || undefined}
                      onChange={(result) => {
                        setIsGooglePhoto(false);
                        setUploadedPhotoUrl(result.secureUrl);
                        field.onChange(result.secureUrl);
                      }}
                      onReset={() => {
                        setIsGooglePhoto(false);
                        setUploadedPhotoUrl(null);
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
            <UsernameField
              setUsernameValidating={setUsernameValidating}
              suggestedUsername={suggestedUsername}
            />
            <LocationField countryCode={countryCode} />
          </div>

          <SkillsField skillsRefreshKey={skillsRefreshKey} />
          <SocialsField />

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
