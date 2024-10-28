import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Select,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { countries, CountryList, type MultiSelectOptions } from '@/constants';
import { SkillSelect } from '@/features/talent';
import { skillSubSkillMap, type SubSkillsType } from '@/interface/skills';
import { useUser } from '@/store/user';
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
    <Box w={'full'} mb={'4rem'}>
      <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
        <FormControl isRequired>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>Username</FormLabel>
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
              isInvalid={isInvalid}
              maxLength={40}
              onChange={(e) => setUsername(e.target.value)}
              value={username}
            />
            {isInvalid && (
              <Text color={'red'} fontSize={'sm'}>
                {validationErrorMessage}
              </Text>
            )}
          </Box>
        </FormControl>

        <Flex justify="space-between" gap={8} w={'full'} mb={'1.25rem'}>
          <FormControl w="full" isRequired>
            <FormLabel color={'brand.slate.500'}>First Name</FormLabel>
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
              maxLength={100}
            />
          </FormControl>
          <FormControl w="full" isRequired>
            <FormLabel color={'brand.slate.500'}>Last Name</FormLabel>
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
              maxLength={100}
            />
          </FormControl>
        </Flex>

        <FormControl isRequired>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>Location</FormLabel>
            <Select
              color={watch().location.length === 0 ? 'brand.slate.300' : ''}
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.400',
              }}
              focusBorderColor="brand.purple"
              id={'location'}
              placeholder="Select your Country"
              {...register('location', { required: true })}
            >
              {CountryList.map((ct) => {
                return (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                );
              })}
            </Select>
          </Box>
        </FormControl>
        <FormControl>
          <VStack align={'start'} gap={2} rowGap={'0'} my={3} mb={'25px'}>
            {user?.photo ? (
              <>
                <FormLabel
                  mb={'0'}
                  pb={'0'}
                  color={'brand.slate.500'}
                  requiredIndicator={<></>}
                >
                  Profile Picture
                </FormLabel>
                <ImagePicker
                  defaultValue={{ url: user.photo }}
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
              </>
            ) : (
              <>
                <FormLabel
                  mb={'0'}
                  pb={'0'}
                  color={'brand.slate.500'}
                  requiredIndicator={<></>}
                >
                  Profile Picture
                </FormLabel>
                <ImagePicker
                  onChange={async (e) => {
                    setUploading(true);
                    const a = await uploadToCloudinary(e, 'earn-pfp');
                    setImageUrl(a);
                    setUploading(false);
                  }}
                  onReset={() => {
                    setImageUrl('');
                    setUploading(false);
                  }}
                />
              </>
            )}
          </VStack>
        </FormControl>

        <FormControl
          aria-autocomplete="none"
          isInvalid={!!errors.publicKey}
          isRequired
        >
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'} aria-autocomplete="none">
              Your Solana Wallet Address
            </FormLabel>
            <FormHelperText mt={0} mb={4} color="brand.slate.500">
              <>
                This is where you will receive your rewards if you win. Download{' '}
                <Text as="u">
                  <Link href="https://backpack.app" isExternal>
                    Backpack
                  </Link>
                </Text>{' '}
                /{' '}
                <Text as="u">
                  <Link href="https://solflare.com" isExternal>
                    Solflare
                  </Link>
                </Text>{' '}
                if you don&apos;t have a Solana wallet
              </>
            </FormHelperText>
            <Input
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.400',
              }}
              aria-autocomplete="none"
              autoComplete="off"
              focusBorderColor="brand.purple"
              id={'publicKey'}
              placeholder="Enter your Solana wallet address"
              required
              {...register('publicKey', {
                validate: (value) => {
                  if (!value) return true;
                  return validateSolAddressUI(value);
                },
              })}
              isInvalid={!!errors.publicKey}
            />
            <FormErrorMessage>
              {errors.publicKey ? <>{errors.publicKey.message}</> : <></>}
            </FormErrorMessage>
          </Box>
        </FormControl>
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
          className="ph-no-capture"
          w={'full'}
          h="50px"
          my={5}
          color={'white'}
          bg={'rgb(101, 98, 255)'}
          isLoading={uploading}
          spinnerPlacement="start"
          type="submit"
        >
          Continue
        </Button>
      </form>
    </Box>
  );
}
