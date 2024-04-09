import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { MediaPicker } from 'degen';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';

import { CountryList } from '@/constants';
import { userStore } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';
import { useUsernameValidation } from '@/utils/useUsernameValidation';

import type { UserStoreType } from './types';

interface Step1Props {
  setStep: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
}

export function AboutYou({ setStep, useFormStore }: Step1Props) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const { updateState, form } = useFormStore();
  const { userInfo } = userStore();
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    userInfo?.photo?.includes('googleusercontent.com') || false,
  );

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      firstName: userInfo?.firstName,
      lastName: userInfo?.lastName,
      username: userInfo?.username ?? '',
      location: form.location,
      photo: userInfo?.photo,
      bio: form.bio,
    },
  });

  const { setUsername, isInvalid, validationErrorMessage, username } =
    useUsernameValidation();

  const onSubmit = async (data: any) => {
    if (isInvalid) {
      return;
    }
    updateState({ ...data, photo: isGooglePhoto ? userInfo?.photo : imageUrl });
    setStep((i) => i + 1);
  };

  return (
    <Box w={'full'}>
      <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
        <FormControl w="full" mb={5} isRequired>
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
              onChange={(e) => setUsername(e.target.value)}
              value={username}
            />
            {isInvalid && (
              <Text color={'red'} fontSize={'sm'}>
                {validationErrorMessage}
              </Text>
            )}
          </Box>

          <Flex justify="space-between" gap={8} w={'full'} mb={'1.25rem'}>
            <Box w="full">
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
              />
            </Box>
            <Box w="full">
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
              />
            </Box>
          </Flex>

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
          <VStack align={'start'} gap={2} rowGap={'0'} my={3} mb={'25px'}>
            {userInfo?.photo ? (
              <>
                <FormLabel
                  mb={'0'}
                  pb={'0'}
                  color={'brand.slate.500'}
                  requiredIndicator={<></>}
                >
                  Profile Picture
                </FormLabel>
                <MediaPicker
                  accept="image/jpeg, image/png, image/webp"
                  defaultValue={{ url: userInfo.photo, type: 'image' }}
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
                  compact
                  label="Choose or drag and drop media"
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
                <MediaPicker
                  accept="image/jpeg, image/png, image/webp"
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
                  compact
                  label="Choose or drag and drop media"
                />
              </>
            )}
          </VStack>

          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>Your One-Line Bio</FormLabel>
            <Textarea
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.400',
              }}
              focusBorderColor="brand.purple"
              id={'bio'}
              maxLength={180}
              placeholder="Here is a sample placeholder"
              {...register('bio', { required: true })}
            />
            <Text
              color={
                (watch('bio')?.length || 0) > 160 ? 'red' : 'brand.slate.400'
              }
              fontSize={'xs'}
              textAlign="right"
            >
              {180 - (watch('bio')?.length || 0)} characters left
            </Text>
          </Box>
          <Button
            w={'full'}
            h="50px"
            color={'white'}
            bg={'rgb(101, 98, 255)'}
            isLoading={uploading}
            spinnerPlacement="start"
            type="submit"
          >
            Continue
          </Button>
        </FormControl>
      </form>
    </Box>
  );
}
