import {
  Button,
  Flex,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { Form, FormLabel } from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import {
  type UserSponsorDetails,
  userSponsorDetailsSchema,
} from '@/features/sponsor';
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
  const form = useForm<UserSponsorDetails>({
    resolver: zodResolver(userSponsorDetailsSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      photo: user?.photo || '',
    },
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );

  const {
    setUsername,
    isInvalid: isUsernameInvalid,
    validationErrorMessage: usernameValidationError,
    username,
  } = useUsernameValidation();

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserSponsorDetails) => {
      const response = await axios.post(
        '/api/sponsors/usersponsor-details/',
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      await refetchUser();
      toast.success('Profile updated successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Error updating user details:', error);
      toast.error('Failed to update profile. Please try again.');
    },
  });

  const onSubmit = (data: UserSponsorDetails) => {
    if (isUsernameInvalid) return;

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
        <Text
          mb={4}
          color="gray.900"
          fontSize="xl"
          fontWeight="semibold"
          letterSpacing="-0.02em"
        >
          Complete Your Profile
        </Text>
        <Form {...form}>
          <form
            style={{ width: '100%' }}
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormFieldWrapper
              control={form.control}
              name="username"
              label="Username"
            >
              <Input
                placeholder="Username"
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                value={username}
              />
            </FormFieldWrapper>
            {isUsernameInvalid && (
              <p className="text-sm text-red-500">{usernameValidationError}</p>
            )}
            <Flex justify="space-between" gap={8} w={'full'} my={'1.25rem'}>
              <FormFieldWrapper
                control={form.control}
                name="firstName"
                label="First Name"
              >
                <Input placeholder="First Name" />
              </FormFieldWrapper>

              <FormFieldWrapper
                control={form.control}
                name="lastName"
                label="Last Name"
              >
                <Input placeholder="Last Name" />
              </FormFieldWrapper>
            </Flex>

            <VStack align={'start'} gap={2} rowGap={'0'} my={3} mb={'25px'}>
              <FormLabel>Profile Picture</FormLabel>
              <ImagePicker
                defaultValue={user?.photo ? { url: user.photo } : undefined}
                onChange={async (e) => {
                  setUploading(true);
                  const url = await uploadToCloudinary(e, 'earn-pfp');
                  setIsGooglePhoto(false);
                  setImageUrl(url);
                  form.setValue('photo', url);
                  setUploading(false);
                }}
                onReset={() => {
                  setImageUrl('');
                  form.setValue('photo', '');
                  setUploading(false);
                }}
              />
            </VStack>

            <Button
              w={'full'}
              isLoading={uploading || updateUserMutation.isPending}
              loadingText="Submitting"
              spinnerPlacement="start"
              type="submit"
            >
              Submit
            </Button>
          </form>
        </Form>
      </ModalContent>
    </Modal>
  );
};
