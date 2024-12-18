import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
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
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

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
  useEffect(() => {
    if (isUsernameInvalid) {
      form.setError('username', {
        message: usernameValidationError,
      });
    } else form.clearErrors('username');
  }, [usernameValidationError, isUsernameInvalid]);

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
    <Dialog open={isOpen} onOpenChange={() => onClose()} modal>
      <DialogContent className="px-6 py-5 sm:max-w-lg">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-gray-900">
          Complete Your Profile
        </h2>
        <Form {...form}>
          <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
            <FormFieldWrapper
              control={form.control}
              name="username"
              label="Username"
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            >
              <Input placeholder="Username" value={username} />
            </FormFieldWrapper>
            <div className="my-5 flex w-full justify-between gap-8">
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
            </div>

            <div className="my-3 mb-6 flex flex-col items-start gap-2">
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
            </div>

            <Button
              className="w-full"
              disabled={uploading || updateUserMutation.isPending}
              type="submit"
            >
              {uploading || updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
