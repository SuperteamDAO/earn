import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Form, FormLabel } from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { uploadAndReplaceImage } from '@/utils/image';

import { SocialInput } from '@/features/social/components/SocialInput';
import {
  type UserSponsorDetails,
  userSponsorDetailsSchema,
} from '@/features/sponsor/utils/sponsorFormSchema';
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

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
      telegram: user?.telegram || '',
    },
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
  useEffect(() => {
    if (isUsernameInvalid) {
      form.setError('username', {
        message: usernameValidationError,
      });
    } else form.clearErrors('username');
  }, [usernameValidationError, isUsernameInvalid]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserSponsorDetails) => {
      const response = await api.post(
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

  const onSubmit = async (data: UserSponsorDetails) => {
    if (isUsernameInvalid) return;

    try {
      setUploading(true);

      let finalPhotoUrl = isGooglePhoto ? user?.photo : data.photo;

      if (selectedFile && !isGooglePhoto) {
        const url = await uploadAndReplaceImage({
          newFile: selectedFile,
          folder: 'earn-pfp',
          oldImageUrl: !isGooglePhoto && user?.photo ? user.photo : undefined,
        });
        finalPhotoUrl = url;
      }

      updateUserMutation.mutate({
        ...data,
        photo: finalPhotoUrl,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => null} modal>
      <DialogContent className="px-6 py-5 sm:max-w-xl">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-gray-900">
          Complete Your Profile
        </h2>
        <Form {...form}>
          <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="mb-5 flex w-full justify-between gap-4">
              <FormFieldWrapper
                control={form.control}
                name="firstName"
                label="First Name"
                isRequired
              >
                <Input placeholder="First Name" />
              </FormFieldWrapper>

              <FormFieldWrapper
                control={form.control}
                name="lastName"
                label="Last Name"
                isRequired
              >
                <Input placeholder="Last Name" />
              </FormFieldWrapper>
            </div>
            <div className="my-5 flex w-full justify-between gap-4">
              <FormFieldWrapper
                control={form.control}
                name="username"
                label="Username"
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                isRequired
              >
                <Input placeholder="Username" value={username} />
              </FormFieldWrapper>
              <SocialInput
                name="telegram"
                socialName={'telegram'}
                formLabel="Telegram"
                placeholder="solanalabs"
                required
                control={form.control}
                height="h-9"
                showIcon={false}
              />
            </div>

            <div className="my-3 mb-6 flex flex-col items-start gap-2">
              <FormLabel>Profile Picture</FormLabel>
              <ImagePicker
                defaultValue={user?.photo ? { url: user.photo } : undefined}
                onChange={(file, previewUrl) => {
                  setSelectedFile(file);
                  setIsGooglePhoto(false);
                  form.setValue('photo', previewUrl);
                }}
                onReset={() => {
                  setSelectedFile(null);
                  setIsGooglePhoto(false);
                  form.setValue('photo', '');
                }}
              />
            </div>

            <Button
              className="w-full"
              disabled={uploading || updateUserMutation.isPending}
              type="submit"
            >
              {uploading || updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Submitting</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
