import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { MediaPicker } from 'degen';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { userStore } from '@/store/user';
import { isUsernameAvailable } from '@/utils/isUsernameAvailable';
import { uploadToCloudinary } from '@/utils/upload';

export const SponsorInfoModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { userInfo, setUserInfo } = userStore();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      firstName: userInfo?.firstName,
      lastName: userInfo?.lastName,
      username: userInfo?.username ?? '',
      photo: userInfo?.photo,
    },
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [userNameValid, setuserNameValid] = useState(true);
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    userInfo?.photo?.includes('googleusercontent.com') || false,
  );

  const onSubmit = async (data: any) => {
    if (data.username && data.username !== userInfo?.username) {
      const avl = await isUsernameAvailable(data.username);
      if (!avl) {
        setuserNameValid(false);
        return;
      }
    }
    const finalData = {
      ...data,
      photo: isGooglePhoto ? userInfo?.photo : imageUrl,
    };
    const updatedUser = await axios.post('/api/user/update/', finalData);
    setUserInfo(updatedUser?.data);
    onClose();
  };

  return (
    <Modal
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <ModalOverlay />
      <ModalContent px={6} py={8}>
        <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
          <FormControl w="full" isRequired>
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
                isInvalid={!userNameValid}
              />
              {!userNameValid && (
                <Text color={'red'}>
                  Username is unavailable! Please try another one.
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
                  <Box w="full" mt={1}>
                    <MediaPicker
                      defaultValue={{ url: userInfo.photo, type: 'image' }}
                      onChange={async (e) => {
                        setUploading(true);
                        const a = await uploadToCloudinary(e);
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
                  </Box>
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
                    onChange={async (e) => {
                      setUploading(true);
                      const a = await uploadToCloudinary(e);
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

            <Button
              w={'full'}
              isLoading={uploading}
              spinnerPlacement="start"
              type="submit"
            >
              Submit
            </Button>
          </FormControl>
        </form>
      </ModalContent>
    </Modal>
  );
};
