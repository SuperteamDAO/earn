import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { SkillsSelect } from '@/components/shared/SkillsSelectNew';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldSelect } from '@/components/ui/form-field-select';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import { countries } from '@/constants/country';
import { CountryList } from '@/constants/countryList';
import { useUser } from '@/store/user';
import { uploadAndReplaceImage } from '@/utils/image';

import { usernameRandomQuery } from '../../queries/random-username';
import { type AboutYouFormData, aboutYouSchema } from '../../schema';
import { useUsernameValidation } from '../../utils/useUsernameValidation';
import type { UserStoreType } from './types';

interface Step1Props {
  setStep: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
}

export function AboutYou({ setStep, useFormStore }: Step1Props) {
  const { updateState, form } = useFormStore();
  const { user } = useUser();
  const posthog = usePostHog();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );
  const [skillsRefreshKey, setSkillsRefreshKey] = useState<number>(0);

  const aboutYouForm = useForm<AboutYouFormData>({
    resolver: zodResolver(aboutYouSchema),
    mode: 'onBlur',
  });
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
    reset,
  } = aboutYouForm;

  const { setUsername, isInvalid, validationErrorMessage, username } =
    useUsernameValidation();

  useEffect(() => {
    aboutYouForm.clearErrors('username');
    if (
      isInvalid &&
      !!validationErrorMessage &&
      !aboutYouForm.formState.errors.username?.message
    ) {
      setError('username', {
        message: validationErrorMessage,
      });
    }
  }, [
    validationErrorMessage,
    isInvalid,
    username,
    aboutYouForm.formState.errors.username?.message,
  ]);

  const { data: randomUsername } = useQuery({
    ...usernameRandomQuery(user?.firstName),
    enabled: !!user && !user.username,
  });

  useEffect(() => {
    if (user) {
      reset({
        username: form.username || user?.username,
        firstName: form.firstName || user?.firstName,
        lastName: form.lastName || user?.lastName,
        skills: aboutYouSchema.shape.skills.safeParse(
          form.skills.length > 0 ? form.skills : user?.skills,
        ).data,
        publicKey: form.publicKey || user?.publicKey,
        photo: form.photo || user?.photo,
        location: aboutYouSchema.shape.location.safeParse(
          form.location || user?.location,
        ).data,
      });
      setSkillsRefreshKey((s) => s + 1);
    }
  }, [user, setValue]);

  useEffect(() => {
    if (user && !user?.username && randomUsername?.username) {
      setValue('username', randomUsername?.username);
      setUsername(randomUsername?.username);
    }
  }, [randomUsername]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (values) {
        updateState({
          ...form,
          username: values.username || '',
          firstName: values.firstName || '',
          lastName: values.lastName || '',
          skills: values.skills || ([] as any),
          publicKey: values.publicKey || '',
          photo: values.photo,
          location: values.location,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, updateState]);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const currentLocation = watch('location');
        if (!currentLocation) {
          const response = await axios.get('https://ipapi.co/json/');
          const locationData = response.data;

          if (locationData && locationData.country_code) {
            const country = countries.find(
              (ct) =>
                ct.code.toLowerCase() ===
                locationData.country_code.toLowerCase(),
            );

            if (country) {
              setValue(
                'location',
                aboutYouSchema.shape.location.safeParse(country.name).data ||
                  undefined,
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch location:', error);
      }
    };

    fetchLocation();
  }, [setValue, watch]);

  const onSubmit = async (data: AboutYouFormData) => {
    if (isInvalid) {
      if (!!validationErrorMessage) {
        setError('username', {
          message: validationErrorMessage,
        });
      } else clearErrors('username');
      aboutYouForm.setFocus('username');
      return false;
    }

    try {
      let finalPhotoUrl = data.photo;
      if (selectedFile && !isGooglePhoto) {
        setUploading(true);
        const oldPhotoUrl =
          !isGooglePhoto && user?.photo ? user.photo : undefined;
        finalPhotoUrl = await uploadAndReplaceImage({
          newFile: selectedFile,
          folder: 'earn-pfp',
          oldImageUrl: oldPhotoUrl,
        });
      }

      posthog.capture('about you_talent');
      updateState({
        ...data,
        photo: isGooglePhoto ? user?.photo : finalPhotoUrl,
      });
      setStep((i) => i + 1);
      return true;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-16 w-full">
      <Form {...aboutYouForm}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormFieldWrapper
            label="Username"
            name="username"
            control={control}
            isRequired
            className="mb-5"
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/\s+/g, '-');
              setUsername(value);
              aboutYouForm.setValue('username', value);
            }}
          >
            <Input maxLength={40} placeholder="Username" />
          </FormFieldWrapper>

          <div className="mb-5 flex w-full justify-between gap-8">
            <FormFieldWrapper
              label="First Name"
              name="firstName"
              control={control}
              isRequired
            >
              <Input maxLength={100} placeholder="First Name" />
            </FormFieldWrapper>
            <FormFieldWrapper
              label="Last Name"
              name="lastName"
              control={control}
              isRequired
            >
              <Input maxLength={100} placeholder="Last Name" />
            </FormFieldWrapper>
          </div>

          <FormFieldSelect
            label="Location"
            options={CountryList}
            name="location"
            placeholder="Select Your Country"
            control={control}
          />

          <FormField
            name="photo"
            control={control}
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel className="mb-1 pb-0">Profile Picture</FormLabel>
                <FormControl>
                  <ImagePicker
                    defaultValue={
                      field.value ? { url: field.value } : undefined
                    }
                    onChange={(file, previewUrl) => {
                      setSelectedFile(file);
                      setIsGooglePhoto(false);
                      field.onChange(previewUrl);
                    }}
                    onReset={() => {
                      setSelectedFile(null);
                      setIsGooglePhoto(false);
                      field.onChange('');
                    }}
                  />
                </FormControl>
                <FormMessage className="mt-1" />
              </FormItem>
            )}
          />

          <FormField
            name="publicKey"
            control={control}
            render={({ field }) => (
              <FormItem className="mb-5">
                <FormLabel isRequired className="">
                  Your Solana Wallet Address
                </FormLabel>
                <FormDescription className="mb-4 mt-0 text-slate-500">
                  This is where you will receive your rewards if you win.
                  Download{' '}
                  <Link
                    className="underline"
                    href="https://backpack.app"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Backpack
                  </Link>
                  {' / '}
                  <Link
                    className="underline"
                    href="https://solflare.com"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Solflare
                  </Link>{' '}
                  if you don&apos;t have a Solana wallet
                </FormDescription>
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Enter your Solana wallet address"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="mt-1" />
              </FormItem>
            )}
          />

          <FormField
            name="skills"
            control={control}
            render={({ field }) => {
              return (
                <FormItem className="mb-5 gap-2">
                  <div>
                    <span className="flex items-center gap-2">
                      <FormLabel isRequired>Skills Needed</FormLabel>
                      <Tooltip content="Select all that apply">
                        <Info className="h-3 w-3 text-slate-500" />
                      </Tooltip>
                    </span>
                    <FormDescription>
                      We will send email notifications of new listings for your
                      selected skills
                    </FormDescription>
                  </div>
                  <FormControl>
                    <SkillsSelect
                      key={skillsRefreshKey}
                      ref={field.ref}
                      defaultValue={field.value || []}
                      onChange={(e) => {
                        field.onChange(e);
                        trigger('skills');
                      }}
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />

          <Button
            className="ph-no-capture my-5 h-[50px] w-full bg-[rgb(101,98,255)] text-white"
            disabled={uploading}
            type="submit"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
