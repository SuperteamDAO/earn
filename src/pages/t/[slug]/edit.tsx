import { zodResolver } from '@hookform/resolvers/zod';
import { usePrivy } from '@privy-io/react-auth';
import { Edit, Info, Loader2, Plus, Trash } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { RegionCombobox } from '@/components/shared/RegionCombobox';
import { SkillsSelect } from '@/components/shared/SkillsSelectNew';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUploadImage } from '@/hooks/use-upload-image';
import type { PoW } from '@/interface/pow';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { IMAGE_SOURCE } from '@/utils/image';

import { SocialInputAll } from '@/features/social/components/SocialInput';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { AddProject } from '@/features/talent/components/AddProject';
import {
  CommunityList,
  IndustryList,
  web3Exp,
  workExp,
  workType,
} from '@/features/talent/constants';
import { type ProfileFormData, profileSchema } from '@/features/talent/schema';
import { hasDevSkills } from '@/features/talent/utils/skills';
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

export default function EditProfilePage({ slug }: { slug: string }) {
  const { user, refetchUser } = useUser();
  const { authenticated, ready } = usePrivy();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
  });
  const { control, handleSubmit, watch, setError, clearErrors, trigger } = form;

  const skills = watch('skills');

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadAndReplace, uploading } = useUploadImage();

  const interestDropdown = useMemo<Option[]>(
    () =>
      IndustryList.map((i) => ({
        value: i,
        label: i,
      })),
    [IndustryList],
  );
  const communityDropdown = useMemo<Option[]>(
    () =>
      CommunityList.map((i) => ({
        value: i,
        label: i,
      })),
    [CommunityList],
  );

  const router = useRouter();

  const [pow, setPow] = useState<PoW[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState<number>(0);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { setUsername, isInvalid, validationErrorMessage, username } =
    useUsernameValidation();

  useEffect(() => {
    form.clearErrors('username');
    if (
      isInvalid &&
      !!validationErrorMessage &&
      !form.formState.errors.username?.message
    ) {
      setError('username', {
        message: validationErrorMessage,
      });
    }
  }, [
    validationErrorMessage,
    isInvalid,
    username,
    form.formState.errors.username?.message,
  ]);

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || undefined,
        bio: user.bio || undefined,
        photo: user.photo || undefined,
        location:
          profileSchema._def.schema.shape.location.safeParse(user?.location)
            .data || undefined,
        skills:
          profileSchema._def.schema.shape.skills.safeParse(user.skills).data ||
          undefined,
        private: user.private || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        discord: user.discord || undefined,
        github: user.github
          ? extractSocialUsername('github', user.github) || undefined
          : undefined,
        twitter: user.twitter
          ? extractSocialUsername('twitter', user.twitter) || undefined
          : undefined,
        linkedin: user.linkedin
          ? extractSocialUsername('linkedin', user.linkedin) || undefined
          : undefined,
        telegram: user.telegram
          ? extractSocialUsername('telegram', user.telegram) || undefined
          : undefined,
        website: user.website || undefined,
        workPrefernce:
          profileSchema._def.schema.shape.workPrefernce.safeParse(
            user.workPrefernce,
          ).data || undefined,
        experience:
          profileSchema._def.schema.shape.experience.safeParse(user.experience)
            .data || undefined,
        cryptoExperience:
          profileSchema._def.schema.shape.cryptoExperience.safeParse(
            user.cryptoExperience,
          ).data || undefined,
        community: user.community
          ? profileSchema._def.schema.shape.community.safeParse(
              JSON.parse(user.community),
            ).data || []
          : [],
        interests: user.interests
          ? profileSchema._def.schema.shape.interests.safeParse(
              JSON.parse(user.interests),
            ).data || []
          : [],
        currentEmployer: user.currentEmployer || undefined,
      });
      setSkillsRefreshKey((s) => s + 1);
    }
  }, [user]);

  useEffect(() => {
    const fetchPoW = async () => {
      try {
        const response = await api.get('/api/pow/get', {
          params: {
            userId: user?.id,
          },
        });
        setPow(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (user?.id) {
      fetchPoW();
    }
  }, [user?.id]);

  const onSubmit = async (data: ProfileFormData) => {
    if (isInvalid) {
      if (!!validationErrorMessage) {
        setError('username', {
          message: validationErrorMessage,
        });
      } else clearErrors('username');
      form.setFocus('username');
      return false;
    }
    const socialFields = [
      'twitter',
      'github',
      'linkedin',
      'website',
      'telegram',
    ];
    const filledSocials = socialFields.filter(
      (field) => data[field as keyof ProfileFormData],
    );

    if (filledSocials.length === 0) {
      toast.error(
        'At least one additional social link (apart from Discord) is required',
      );
      return;
    }

    setIsLoading(true);
    posthog.capture('confirm_edit profile');
    try {
      await toast
        .promise(
          async () => {
            if (selectedPhoto) {
              const uploadResult = await uploadAndReplace(
                selectedPhoto,
                {
                  folder: 'earn-pfp',
                  resource_type: 'image',
                  source: IMAGE_SOURCE.USER,
                },
                user?.photo,
              );
              data.photo = uploadResult.url;
            }

            const finalUpdatedData = Object.keys(data).reduce((acc, key) => {
              const fieldKey = key as keyof ProfileFormData;
              const newValue = data[fieldKey];
              const oldValue = user?.[fieldKey];

              if (newValue === undefined && oldValue === undefined) return acc;
              if (newValue === undefined && oldValue === null) return acc;
              if (newValue === undefined && oldValue === '') return acc;
              if (newValue === null && oldValue === null) return acc;

              try {
                let normalizedOldValue: any = oldValue;
                const normalizedNewValue: any = newValue;

                if (
                  typeof oldValue === 'string' &&
                  (oldValue.startsWith('{') || oldValue.startsWith('['))
                ) {
                  try {
                    normalizedOldValue = JSON.parse(oldValue);
                  } catch {
                    // If parsing fails, keep original string value
                    normalizedOldValue = oldValue;
                  }
                }

                const oldValueStr =
                  typeof normalizedOldValue === 'object'
                    ? JSON.stringify(normalizedOldValue)
                    : String(normalizedOldValue);

                const newValueStr =
                  typeof normalizedNewValue === 'object'
                    ? JSON.stringify(normalizedNewValue)
                    : String(normalizedNewValue);

                if (oldValueStr !== newValueStr) {
                  acc[fieldKey] = newValue as any;
                }
              } catch (error) {
                if (oldValue !== newValue) {
                  acc[fieldKey] = newValue as any;
                }
              }

              return acc;
            }, {} as Partial<ProfileFormData>);

            await api.post('/api/pow/edit', {
              pows: pow,
            });

            await api.post('/api/user/edit', { ...finalUpdatedData });

            await refetchUser();

            setTimeout(() => {
              router.push(`/t/${data.username}`);
            }, 500);
          },
          {
            loading: 'Updating your profile...',
            success: 'Your profile has been updated successfully!',
            error: 'Failed to update profile.',
          },
        )
        .unwrap();
      return true;
    } catch (error: any) {
      console.error('Error edit profile - ', error);
      toast.error('Failed to update profile.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && slug !== user?.username) {
      router.push(`/t/${slug}`);
    }
  }, [slug, router, user]);

  if (ready && !authenticated) {
    router.push('/');
  }

  return (
    <Default
      meta={
        <Meta
          title="Superteam Earn"
          description="Every Solana opportunity in one place!"
        />
      }
    >
      <div className="bg-white">
        <div className="mx-auto max-w-[600px] p-3 md:p-5">
          <Form {...form}>
            <h1 className="mt-3 mb-5 text-4xl font-bold">Edit Profile</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              <p className="mt-12 mb-5 text-lg font-semibold text-slate-600">
                PERSONAL INFO
              </p>
              <FormField
                name="photo"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="mb-1 pb-0">Profile Picture</FormLabel>
                    <FormControl>
                      <ImagePicker
                        defaultValue={
                          field.value ? { url: field.value } : undefined
                        }
                        onChange={(file, previewUrl) => {
                          setSelectedPhoto(file);
                          field.onChange(previewUrl);
                        }}
                        onReset={() => {
                          setSelectedPhoto(null);
                          field.onChange('');
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormFieldWrapper
                label="Username"
                name="username"
                control={control}
                isRequired
                className="mb-5"
                onChange={(e) => {
                  const value = e.target.value.replace(/\s+/g, '-'); // Replace spaces with dashes
                  setUsername(value);
                  form.setValue('username', value);
                }}
              >
                <Input maxLength={40} placeholder="Username" />
              </FormFieldWrapper>

              <FormFieldWrapper
                label="First Name"
                name="firstName"
                control={control}
                isRequired
                className="mb-5"
              >
                <Input placeholder="First Name" />
              </FormFieldWrapper>

              <FormFieldWrapper
                className="mb-5"
                label="Last Name"
                name="lastName"
                control={control}
                isRequired
              >
                <Input placeholder="Last Name" />
              </FormFieldWrapper>

              <FormField
                control={control}
                name={'bio'}
                render={({ field }) => (
                  <FormItem className={cn('mb-5 flex flex-col gap-2')}>
                    <div>
                      <FormLabel>Your One-Line Bio</FormLabel>
                    </div>
                    <div>
                      <FormControl>
                        <Textarea
                          {...field}
                          maxLength={180}
                          placeholder="One line bio"
                        />
                      </FormControl>
                      <p
                        className={cn(
                          'mt-1 text-right text-xs',
                          (watch('bio')?.length || 0) > 160
                            ? 'text-red-500'
                            : 'text-slate-400',
                        )}
                      >
                        {180 - (watch('bio')?.length || 0)} characters left
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <p className="mt-12 mb-5 text-lg font-semibold text-slate-600">
                SOCIALS
              </p>

              <SocialInputAll
                control={control}
                required={hasDevSkills(skills) ? ['github'] : ['twitter']}
              />

              <p className="mt-12 mb-5 text-lg font-semibold text-slate-600">
                WORK
              </p>

              <FormField
                name="interests"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel>
                      What areas of Web3 are you most interested in?
                    </FormLabel>
                    <FormControl>
                      <MultiSelect
                        className="mt-2"
                        value={
                          field.value?.map((elm) => ({
                            label: elm,
                            value: elm,
                          })) || []
                        }
                        options={interestDropdown}
                        onChange={(e) => field.onChange(e.map((r) => r.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="community"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel>Community Affiliations</FormLabel>
                    <FormControl>
                      <MultiSelect
                        className="mt-2"
                        value={
                          field.value?.map((elm) => ({
                            label: elm,
                            value: elm,
                          })) || []
                        }
                        options={communityDropdown}
                        onChange={(e) => field.onChange(e.map((r) => r.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="experience"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel>Work Experience</FormLabel>
                    <FormControl>
                      <Select
                        key={skillsRefreshKey}
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pick Your Experience" />
                        </SelectTrigger>
                        <SelectContent>
                          {workExp.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="location"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-4 w-full gap-2">
                    <FormLabel className="">Location</FormLabel>
                    <FormControl>
                      <RegionCombobox
                        className="w-full"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                        classNames={{
                          popoverContent:
                            'w-[var(--radix-popper-anchor-width)]',
                        }}
                      />
                    </FormControl>
                    <FormMessage className="mt-1" />
                  </FormItem>
                )}
              />

              <FormField
                name="cryptoExperience"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel>How familiar are you with Web3?</FormLabel>
                    <FormControl>
                      <Select
                        key={skillsRefreshKey}
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pick your Experience" />
                        </SelectTrigger>
                        <SelectContent>
                          {web3Exp.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="workPrefernce"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-5 w-full">
                    <FormLabel>Work Preference</FormLabel>
                    <FormControl>
                      <Select
                        key={skillsRefreshKey}
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type of Work" />
                        </SelectTrigger>
                        <SelectContent>
                          {workType.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormFieldWrapper
                className="mb-5"
                label="Current Employer"
                name="currentEmployer"
                control={control}
              >
                <Input placeholder="Employer" />
              </FormFieldWrapper>

              <FormLabel>Proof of Work</FormLabel>
              <div>
                {pow.map((data, idx) => {
                  return (
                    <div
                      className="mt-2 mb-1.5 flex items-center gap-3 rounded-md border border-slate-300 px-[1rem] py-[0.5rem] break-all text-slate-500"
                      key={data.id}
                    >
                      <p className="w-full text-sm text-gray-800">
                        {data.title}
                      </p>
                      <div className="flex items-center gap-3">
                        <Edit
                          onClick={() => {
                            setSelectedProject(idx);
                            onOpen();
                          }}
                          className="h-3.5 w-3.5 cursor-pointer"
                        />
                        <Trash
                          onClick={() => {
                            setPow((prevPow) =>
                              prevPow.filter((_ele, id) => idx !== id),
                            );
                          }}
                          className="h-3.5 w-3.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                className="mb-8 w-full"
                onClick={() => {
                  onOpen();
                }}
                variant="outline"
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>

              <FormField
                name="skills"
                control={control}
                render={({ field }) => {
                  return (
                    <FormItem className="mb-5 gap-2">
                      <div>
                        <span className="flex items-center gap-2">
                          <FormLabel isRequired>Skills Needed</FormLabel>
                          <Tooltip content="Select all that apply">
                            <Info className="h-3 w-3 text-slate-500" />
                          </Tooltip>
                        </span>
                        <FormDescription>
                          We will send email notifications of new listings for
                          your selected skills
                        </FormDescription>
                      </div>
                      <FormControl>
                        <SkillsSelect
                          key={skillsRefreshKey}
                          defaultValue={field.value || []}
                          onChange={(e) => {
                            field.onChange(e);
                            trigger('skills');
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />

              <FormField
                name="private"
                control={control}
                render={({ field }) => (
                  <FormItem className="mb-8">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (typeof checked === 'boolean') {
                              field.onChange(checked);
                            }
                          }}
                          className="text-brand-purple data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple mr-1"
                        ></Checkbox>
                      </FormControl>
                      <FormLabel className="font-medium text-slate-500">
                        Keep my info private
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <br />

              <Button
                className={cn(
                  'ph-no-capture mb-12',
                  (uploading || isLoading) && 'pointer-events-none opacity-50',
                )}
                type="submit"
                disabled={uploading || isLoading}
              >
                {uploading || isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </span>
                ) : (
                  <span>Update Profile</span>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <AddProject
        key={`${pow.length}project`}
        {...{
          isOpen,
          onClose,
          pow,
          setPow,
          selectedProject,
          setSelectedProject,
        }}
      />
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};
