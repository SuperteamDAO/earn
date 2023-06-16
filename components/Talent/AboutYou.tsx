import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { MediaPicker } from 'degen';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { CountryList } from '@/constants';
import { userStore } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';
import { isUsernameAvailable } from '@/utils/username';

import type { UserStoreType } from './types';

interface Step1Props {
  setStep: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
}

function AboutYou({ setStep, useFormStore }: Step1Props) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadLoading, setuploadLoading] = useState<boolean>(false);
  const [userNameValid, setuserNameValid] = useState(true);
  const { updateState, form } = useFormStore();
  const { userInfo } = userStore();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      username: userInfo?.username ?? '',
      location: form.location,
      photo: form.photo,
      bio: form.bio,
    },
  });

  const onSubmit = async (data: any) => {
    if (data.username && data.username !== userInfo?.username) {
      const avl = await isUsernameAvailable(data.username);
      if (!avl) {
        setuserNameValid(false);
        return;
      }
    }
    updateState({ ...data, photo: imageUrl });
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
                color: 'brand.slate.300',
              }}
              focusBorderColor="brand.purple"
              id="username"
              placeholder="Username"
              {...register('username', { required: true })}
              isInvalid={!userNameValid}
            />
            {!userNameValid && (
              <Text color={'red'}>
                Username is unavailable! Please try another one.
              </Text>
            )}
          </Box>

          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>Location</FormLabel>
            <Select
              color={watch().location.length === 0 ? 'brand.slate.300' : ''}
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.300',
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
          <VStack align={'start'} gap={2} rowGap={'0'} mb={'25px'} my={3}>
            <FormLabel
              mb={'0'}
              pb={'0'}
              color={'brand.slate.500'}
              requiredIndicator={<></>}
            >
              Profile Picture
            </FormLabel>
            <MediaPicker
              onChange={async (e) => {
                setuploadLoading(true);
                const a = await uploadToCloudinary(e);
                setImageUrl(a);
                setuploadLoading(false);
              }}
              onReset={() => {
                setImageUrl('');
                setuploadLoading(false);
              }}
              compact
              label="Choose or drag and drop media"
            />
          </VStack>

          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>Your One-Line Bio</FormLabel>
            <Textarea
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.300',
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
            isLoading={uploadLoading}
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

export default AboutYou;
