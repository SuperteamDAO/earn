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
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { useUsernameValidation } from '@/features/talent';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

export const SponsorInfoModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { user, refetchUser } = useUser();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      firstName: user?.firstName,
      lastName: user?.lastName,
      username: user?.username ?? '',
      photo: user?.photo,
    },
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );

  const { setUsername, isInvalid, validationErrorMessage, username } =
    useUsernameValidation();

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(
        '/api/sponsors/usersponsor-details/',
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      await refetchUser();
      toast.success('个人资料更新成功');
      onClose();
    },
    onError: (error) => {
      console.error('Error updating user details:', error);
      toast.error('更新个人资料失败，请重试。');
    },
  });

  const onSubmit = (data: any) => {
    if (isInvalid) {
      return;
    }
    const finalData = {
      ...data,
      photo: isGooglePhoto ? user?.photo : imageUrl,
    };
    updateUserMutation.mutate(finalData);
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
      <ModalContent px={6} py={5}>
        <Text mb={3} color="brand.slate.600" fontSize={'2xl'} fontWeight={600}>
          完成您的个人资料
        </Text>
        <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
          <FormControl w="full" isRequired>
            <Box w={'full'} mb={'1.25rem'}>
              <FormLabel color={'brand.slate.500'}>用户名</FormLabel>
              <Input
                color={'gray.800'}
                borderColor="brand.slate.300"
                _placeholder={{
                  color: 'brand.slate.400',
                }}
                focusBorderColor="brand.purple"
                id="username"
                placeholder=""
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
                <FormLabel color={'brand.slate.500'}>名字</FormLabel>
                <Input
                  color={'gray.800'}
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.400',
                  }}
                  focusBorderColor="brand.purple"
                  id="firstName"
                  placeholder=""
                  {...register('firstName', { required: true })}
                />
              </Box>
              <Box w="full">
                <FormLabel color={'brand.slate.500'}>姓</FormLabel>
                <Input
                  color={'gray.800'}
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.400',
                  }}
                  focusBorderColor="brand.purple"
                  id="lastName"
                  placeholder=""
                  {...register('lastName', { required: true })}
                />
              </Box>
            </Flex>

            <VStack align={'start'} gap={2} rowGap={'0'} my={3} mb={'25px'}>
              {user?.photo ? (
                <>
                  <FormLabel
                    mb={'0'}
                    pb={'0'}
                    color={'brand.slate.500'}
                    requiredIndicator={<></>}
                  >
                    个人头像
                  </FormLabel>
                  <Box w="full" mt={1}>
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
                    个人头像
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

            <Button
              w={'full'}
              isLoading={uploading || updateUserMutation.isPending}
              loadingText="提交中"
              spinnerPlacement="start"
              type="submit"
            >
              提交
            </Button>
          </FormControl>
        </form>
      </ModalContent>
    </Modal>
  );
};
