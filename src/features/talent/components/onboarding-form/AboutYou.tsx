import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { countries } from '@/constants/country';
import { CountryList } from '@/constants/countryList';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

import { usernameRandomQuery } from '../../queries';
import { type AboutYouFormData, aboutYouSchema } from '../../schema';
import { useUsernameValidation } from '../../utils';
import type { UserStoreType } from './types';

interface Step1Props {
  setStep: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
}

export function AboutYou({ setStep, useFormStore }: Step1Props) {
  const [uploading, setUploading] = useState<boolean>(false);
  const { updateState } = useFormStore();
  const { user } = useUser();
  const posthog = usePostHog();
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );

  const aboutYouForm = useForm<AboutYouFormData>({
    resolver: zodResolver(aboutYouSchema),
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

  const { setUsername, isInvalid, validationErrorMessage } =
    useUsernameValidation();

  const watchedUsername = watch('username');
  useEffect(() => {
    if (watchedUsername) setUsername(watchedUsername);
  }, [watchedUsername]);

  useEffect(() => {
    if (isInvalid && !!validationErrorMessage) {
      setError('username', {
        message: validationErrorMessage,
      });
    } else clearErrors('username');
  }, [validationErrorMessage, isInvalid]);

  const { data: randomUsername } = useQuery({
    ...usernameRandomQuery(user?.firstName),
    enabled: !!user && !user.username,
  });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        skills: (user.skills as any) || undefined,
        publicKey: user.publicKey || undefined,
        photo: user.photo || undefined,
        location: (user?.location as any) || undefined,
      });
    }
  }, [user, setValue]);

  useEffect(() => {
    if (user && !user?.username && randomUsername?.username) {
      setValue('username', randomUsername?.username);
      setUsername(randomUsername?.username);
    }
  }, [randomUsername]);

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
    posthog.capture('about you_talent');
    updateState({
      ...data,
      photo: isGooglePhoto ? user?.photo : data.photo,
    });
    setStep((i) => i + 1);
    return true;
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

          <FormFieldWrapper
            name="location"
            control={control}
            className="mb-5 w-full"
            label="Location"
          >
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select Your Country" />
              </SelectTrigger>
              <SelectContent>
                {CountryList.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldWrapper>

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
                    onChange={async (e) => {
                      setUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-pfp');
                      setIsGooglePhoto(false);
                      field.onChange(a);
                      setUploading(false);
                    }}
                    onReset={() => {
                      field.onChange('');
                      setUploading(false);
                    }}
                  />
                </FormControl>
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
                <FormMessage />
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
                      ref={field.ref}
                      key={JSON.stringify(field.value)}
                      defaultValue={field.value || []}
                      onChange={(e) => {
                        field.onChange(e);
                        trigger('skills');
                      }}
                    />
                  </FormControl>
                  <FormMessage />
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
