'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash.debounce';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploader } from '@/components/shared/ImageUploader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Form, FormLabel } from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { getJson, postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';

import { SocialInput } from '@/features/social/components/SocialInput';
import {
  type UserSponsorDetails,
  userSponsorDetailsSchema,
} from '@/features/sponsor/utils/sponsorFormSchema';
import { USERNAME_PATTERN } from '@/features/talent/constants';

// Earn's useUsernameValidation, reading the viewer instead of its old
// store; `report` gets the field's error, or null once it's fine.
function useUsernameValidation(
  current: string | null | undefined,
  report: (message: string | null) => void,
) {
  const [username, setUsernameValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  const settle = useCallback(
    (message: string | null) => {
      setIsInvalid(message !== null);
      report(message);
    },
    [report],
  );

  const check = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!USERNAME_PATTERN.test(value)) {
          settle("Username can only contain letters, numbers, '_', and '-'");
          return;
        }
        try {
          const { available } = await getJson<{ available: boolean }>(
            `/api/user/username/?username=${encodeURIComponent(value)}`,
          );
          settle(
            available
              ? null
              : 'Username is unavailable! Please try another one.',
          );
        } catch {
          settle('An error occurred while checking username availability.');
        }
      }, 300),
    [settle],
  );

  useEffect(() => () => check.cancel(), [check]);

  const setUsername = (value: string) => {
    setUsernameValue(value);
    check.cancel();
    if (!value) return;
    if (value.toLowerCase() === current?.toLowerCase()) {
      settle(null);
      return;
    }
    void check(value);
  };

  return { setUsername, isInvalid, username };
}

export const SponsorInfoModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const user = useViewer();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

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

  const [isGooglePhoto, setIsGooglePhoto] = useState<boolean>(
    user?.photo?.includes('googleusercontent.com') || false,
  );

  const reportUsername = useCallback(
    (message: string | null) => {
      if (message) form.setError('username', { message });
      else form.clearErrors('username');
    },
    [form],
  );
  const {
    setUsername,
    isInvalid: isUsernameInvalid,
    username,
  } = useUsernameValidation(user?.username, reportUsername);

  const updateUser = async (data: UserSponsorDetails) => {
    setIsPending(true);
    try {
      await postJson('/api/sponsors/usersponsor-details/', data);
      router.refresh();
      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating user details:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsPending(false);
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UserSponsorDetails) => {
    setIsLoading(true);
    if (isUsernameInvalid) return;

    const finalPhoto =
      uploadedPhotoUrl || (isGooglePhoto ? user?.photo : data.photo);

    void updateUser({
      ...data,
      photo: finalPhoto ?? undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => null} modal>
      <DialogContent className="px-6 py-5 sm:max-w-xl" hideCloseIcon>
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-gray-900">
          Complete Your Profile
        </h2>
        <Form {...form}>
          <form
            className="w-full"
            onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          >
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

            <div className="my-3 mb-6 flex w-full flex-col items-start gap-2">
              <FormLabel>Profile Picture</FormLabel>
              <ImageUploader
                source="user"
                className="w-full"
                defaultValue={user?.photo || undefined}
                onChange={(result) => {
                  setIsGooglePhoto(false);
                  setUploadedPhotoUrl(result.secureUrl);
                  form.setValue('photo', result.secureUrl);
                }}
                onReset={() => {
                  setIsGooglePhoto(false);
                  setUploadedPhotoUrl(null);
                  form.setValue('photo', '');
                }}
              />
            </div>

            <Button
              className="w-full"
              disabled={isLoading || isPending}
              type="submit"
            >
              {isLoading || isPending ? (
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
