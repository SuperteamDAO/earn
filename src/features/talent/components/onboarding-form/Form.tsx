import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import {
  type NewTalentFormData,
  newTalentSchema,
  socialSuperRefine,
} from '@/features/talent/schema';

import { LocationField } from './fields/Location';
import { PhotoField } from './fields/Photo';
import { PublicKeyField } from './fields/PublicKey';
import { SkillsField } from './fields/Skills';
import { SocialsField } from './fields/Socials';
import { UsernameField } from './fields/Username';
export const TalentForm = () => {
  const posthog = usePostHog();
  const router = useRouter();
  const { user, refetchUser } = useUser();

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

  const [uploading, setUploading] = useState<boolean>(false);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );
  const [skillsRefreshKey, setSkillsRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (user) {
      reset({
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        skills: newTalentSchema.shape.skills.safeParse(user?.skills).data,
        publicKey: user?.publicKey,
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
    return uploading || isLoading;
  }, [uploading || isLoading]);

  const onSubmit = async (data: NewTalentFormData) => {
    if (isSubmitDisabled) return false;
    if (errors.username?.message) {
      form.setFocus('username');
      return;
    }
    setisLoading(true);
    posthog.capture('finish profile_talent');
    try {
      toast.promise(
        async () => {
          try {
            await api.post('/api/user/complete-profile/', {
              ...data,
              photo: isGooglePhoto ? user?.photo : data.photo,
            });
            await refetchUser();
            setisLoading(false);
          } catch (err) {
            setisLoading(false);
            throw err;
          }
        },
        {
          loading: 'Creating your profile...',
          success: 'Your profile has been created successfully!',
          error: 'Failed to create your profile.',
        },
      );
      return true;
    } catch {
      setisLoading(false);
      return false;
    }
  };

  return (
    <div className="">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ width: '100%' }}>
          <div className="mb-3 mt-4 flex flex-col text-left sm:mb-4 2xl:mt-8">
            <h1 className="font-sans text-lg font-medium md:text-2xl">
              {TitleArray?.title}
            </h1>
            <p className="text-base text-slate-500 md:text-lg">
              {TitleArray?.subTitle}
            </p>
          </div>
          <div className="mb-3 flex items-start gap-4 sm:mb-4">
            <PhotoField
              setIsGooglePhoto={setIsGooglePhoto}
              setUploading={setUploading}
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
            <UsernameField />
            <LocationField />
          </div>

          <PublicKeyField />
          <SkillsField skillsRefreshKey={skillsRefreshKey} />
          <SocialsField />
          <Button
            type="submit"
            className="mb-12 mt-5 w-full sm:mt-8"
            disabled={isSubmitDisabled}
          >
            Create Profile
          </Button>
        </form>
      </Form>
    </div>
  );
};
