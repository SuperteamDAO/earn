import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type MultiSelectOptions } from '@/constants';
import { countries } from '@/constants/country';
import { CountryList } from '@/constants/countryList';
import { SkillSelect } from '@/features/talent';
import { skillSubSkillMap, type SubSkillsType } from '@/interface/skills';
import { useUser } from '@/store/user';
import { cn } from '@/utils';
import { uploadToCloudinary } from '@/utils/upload';
import { validateSolAddressUI } from '@/utils/validateSolAddress';

import { usernameRandomQuery } from '../../queries';
import { useUsernameValidation } from '../../utils';
import type { UserStoreType } from './types';

interface Step1Props {
  setStep: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
}

export function AboutYou({ setStep, useFormStore }: Step1Props) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const { updateState, form } = useFormStore();
  const [post, setPost] = useState(false);
  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);
  const { user } = useUser();
  const posthog = usePostHog();
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName,
      lastName: user?.lastName,
      username: user?.username ?? '',
      location: form.location,
      photo: user?.photo,
      publicKey: form.publicKey,
      skills: form.skills,
      subskills: form.subSkills,
    },
  });

  const { setUsername, isInvalid, validationErrorMessage, username } =
    useUsernameValidation();

  const { data: randomUsername } = useQuery({
    ...usernameRandomQuery(user?.firstName),
    enabled: !!user && !user.username,
  });

  useEffect(() => {
    if (user) {
      console.log('user', user);
      setValue('firstName', user?.firstName);
      setValue('lastName', user?.lastName);
      setValue('publicKey', user?.publicKey || '');
      setValue('username', user?.username || '');
      setUsername(user?.username || '');
      setValue('photo', user?.photo);
      setImageUrl(user.photo || '');
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
              setValue('location', country.name);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch location:', error);
      }
    };

    fetchLocation();
  }, [setValue, watch]);

  const onSubmit = async (data: any) => {
    setPost(true);
    if (skills.length === 0 || subSkills.length === 0) {
      return false;
    }
    if (isInvalid) {
      return false;
    }
    posthog.capture('about you_talent');
    updateState({
      ...data,
      photo: isGooglePhoto ? user?.photo : imageUrl,
      skills: skills.map((mainskill) => {
        const main =
          skillSubSkillMap[mainskill.value as keyof typeof skillSubSkillMap];
        const sub: SubSkillsType[] = [];

        subSkills.forEach((subskill) => {
          if (
            main &&
            main.some((subSkillObj) => subSkillObj.value === subskill.value)
          ) {
            sub.push(subskill.value as SubSkillsType);
          }
        });

        return {
          skills: mainskill.value,
          subskills: sub ?? [],
        };
      }),
      subSkills: JSON.stringify(subSkills.map((ele) => ele.value)),
    });
    setStep((i) => i + 1);
    return true;
  };

  return (
    <div className="mb-16 w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormItem className="mb-6">
          <FormLabel className="text-slate-500" htmlFor="username">
            Username
          </FormLabel>
          <FormControl>
            <Input
              className={cn(
                'border-slate-300 text-gray-800',
                'placeholder:text-slate-400',
                'focus:border-purple-600 focus:ring-purple-600',
              )}
              placeholder="Username"
              {...register('username', { required: true })}
              maxLength={40}
              onChange={(e) => setUsername(e.target.value)}
              value={username}
            />
          </FormControl>
          {isInvalid && <FormMessage>{validationErrorMessage}</FormMessage>}
        </FormItem>

        <div className="mb-5 flex w-full justify-between gap-8">
          <FormItem className="w-full">
            <FormLabel className="text-slate-500" htmlFor="firstName">
              First Name
            </FormLabel>
            <FormControl>
              <Input
                className="border-slate-300 text-gray-800 placeholder:text-slate-400 focus:border-purple-600 focus:ring-purple-600"
                placeholder="First Name"
                {...register('firstName', { required: true })}
                maxLength={100}
              />
            </FormControl>
          </FormItem>

          <FormItem className="w-full">
            <FormLabel className="text-slate-500" htmlFor="lastName">
              Last Name
            </FormLabel>
            <FormControl>
              <Input
                className="border-slate-300 text-gray-800 placeholder:text-slate-400 focus:border-purple-600 focus:ring-purple-600"
                placeholder="Last Name"
                {...register('lastName', { required: true })}
                maxLength={100}
              />
            </FormControl>
          </FormItem>
        </div>

        <FormItem className="mb-5">
          <FormLabel className="text-slate-500">Location</FormLabel>
          <Select
            onValueChange={(value) => setValue('location', value)}
            value={watch('location')}
          >
            <SelectTrigger
              className={cn(
                'border-slate-300',
                'text-slate-300',
                'focus:border-purple-600 focus:ring-purple-600',
                watch().location && 'text-gray-800',
              )}
            >
              <SelectValue placeholder="Select your Country" />
            </SelectTrigger>
            <SelectContent>
              {CountryList.map((ct) => (
                <SelectItem key={ct} value={ct}>
                  {ct}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>

        <FormItem className="my-3 mb-6">
          <FormLabel className="mb-0 pb-0 text-slate-500">
            Profile Picture
          </FormLabel>
          <ImagePicker
            defaultValue={user?.photo ? { url: user.photo } : undefined}
            onChange={async (e) => {
              setUploading(true);
              const a = await uploadToCloudinary(e, 'earn-pfp');
              setIsGooglePhoto(false);
              setImageUrl(a);
              setUploading(false);
            }}
            onReset={() => {
              setImageUrl('');
              setUploading(false);
            }}
          />
        </FormItem>

        <FormItem className="mb-5">
          <FormLabel className="text-slate-500">
            Your Solana Wallet Address
          </FormLabel>
          <FormDescription className="mb-4 mt-0 text-slate-500">
            This is where you will receive your rewards if you win. Download{' '}
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
            </Link>
            if you don&apos;t have a Solana wallet
          </FormDescription>
          <FormControl>
            <Input
              className="border-slate-300 placeholder:text-slate-400 focus:border-purple-600 focus:ring-purple-600"
              autoComplete="off"
              placeholder="Enter your Solana wallet address"
              {...register('publicKey', {
                validate: (value) => {
                  if (!value) return true;
                  return validateSolAddressUI(value);
                },
              })}
            />
          </FormControl>
          {errors.publicKey && (
            <FormMessage>{errors.publicKey.message}</FormMessage>
          )}
        </FormItem>

        <SkillSelect
          errorSkill={post && skills.length === 0}
          errorSubSkill={post && subSkills.length === 0}
          skills={skills}
          subSkills={subSkills}
          setSkills={setSkills}
          setSubSkills={setSubSkills}
          helperText="We will send email notifications of new listings for your selected skills"
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
    </div>
  );
}
