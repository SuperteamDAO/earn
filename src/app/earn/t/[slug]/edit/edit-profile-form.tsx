'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Info, Loader2, Plus, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImageUploader } from '@/components/shared/ImageUploader';
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
import type { PoW } from '@/interface/pow';
import { postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';

import { SocialInputAll } from '@/features/social/components/SocialInput';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { AddProject } from '@/features/talent/components/AddProject';
import { UpdateLocationConfirmModal } from '@/features/talent/components/UpdateLocationConfirmModal';
import {
  CommunityList,
  IndustryList,
  web3Exp,
  workExp,
  workType,
} from '@/features/talent/constants';
import {
  type ProfileFormData,
  profileObjectSchema,
  profileSchema,
} from '@/features/talent/schema';
import { hasDevSkills } from '@/features/talent/utils/skills';
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

const interestDropdown: Option[] = IndustryList.map((i) => ({
  value: i,
  label: i,
}));

interface EditProfilePageProps {
  chapterNames: ReadonlyArray<string>;
  // Their proof of work, loaded with the page.
  initialPow: PoW[];
}

// Earn's edit profile form; the page checks it's theirs.
export function EditProfileForm({
  chapterNames,
  initialPow,
}: EditProfilePageProps) {
  const user = useViewer();
  const communityDropdown: Option[] = [...chapterNames, ...CommunityList].map(
    (name) => ({
      value: name,
      label: name,
    }),
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
  });
  const { control, handleSubmit, watch, setError, clearErrors, trigger } = form;

  const skills = watch('skills');

  const userRef = useRef(user);
  userRef.current = user;

  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  const router = useRouter();

  const [pow, setPow] = useState<PoW[]>(initialPow);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState<number>(0);
  const [pendingProfileSubmit, setPendingProfileSubmit] =
    useState<ProfileFormData | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { setUsername, isInvalid, validationErrorMessage, validating } =
    useUsernameValidation();

  useEffect(() => {
    if (isInvalid && validationErrorMessage) {
      setError('username', {
        message: validationErrorMessage,
      });
    } else if (!isInvalid) {
      form.clearErrors('username');
    }
  }, [validationErrorMessage, isInvalid, setError, form]);

  useEffect(() => {
    const currentUser = userRef.current;
    if (currentUser) {
      form.reset({
        username: currentUser.username || undefined,
        bio: currentUser.bio || undefined,
        photo: currentUser.photo || undefined,
        location:
          profileObjectSchema.shape.location.safeParse(currentUser?.location)
            .data || undefined,
        skills:
          profileObjectSchema.shape.skills.safeParse(currentUser.skills).data ||
          undefined,
        private: currentUser.private || undefined,
        firstName: currentUser.firstName || undefined,
        lastName: currentUser.lastName || undefined,
        discord: currentUser.discord || undefined,
        github: currentUser.github
          ? extractSocialUsername('github', currentUser.github) || undefined
          : undefined,
        twitter: currentUser.twitter
          ? extractSocialUsername('twitter', currentUser.twitter) || undefined
          : undefined,
        linkedin: currentUser.linkedin
          ? extractSocialUsername('linkedin', currentUser.linkedin) || undefined
          : undefined,
        telegram: currentUser.telegram
          ? extractSocialUsername('telegram', currentUser.telegram) || undefined
          : undefined,
        website: currentUser.website || undefined,
        workPrefernce:
          profileObjectSchema.shape.workPrefernce.safeParse(
            currentUser.workPrefernce,
          ).data || undefined,
        experience:
          profileObjectSchema.shape.experience.safeParse(currentUser.experience)
            .data || undefined,
        cryptoExperience:
          profileObjectSchema.shape.cryptoExperience.safeParse(
            currentUser.cryptoExperience,
          ).data || undefined,
        community: currentUser.community
          ? profileObjectSchema.shape.community.safeParse(
              JSON.parse(currentUser.community),
            ).data || []
          : [],
        interests: currentUser.interests
          ? profileObjectSchema.shape.interests.safeParse(
              JSON.parse(currentUser.interests),
            ).data || []
          : [],
        currentEmployer: currentUser.currentEmployer || undefined,
      });
      setSkillsRefreshKey((s) => s + 1);
    }
  }, [user?.id, form]);

  const onSubmit = async (data: ProfileFormData) => {
    if (validating) {
      toast.error('Please wait for username validation');
      return false;
    }
    if (isInvalid) {
      if (validationErrorMessage) {
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
    ] as const;
    const filledSocials = socialFields.filter((field) => data[field]);

    if (filledSocials.length === 0) {
      toast.error(
        'At least one additional social link (apart from Discord) is required',
      );
      return false;
    }

    const previousLocation = user?.location || '';
    const nextLocation = data.location || '';
    if (previousLocation && previousLocation !== nextLocation) {
      setPendingProfileSubmit(data);
      return false;
    }

    return submitProfile(data);
  };

  const submitProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    posthog.capture('confirm_edit profile');
    try {
      await toast
        .promise(
          async () => {
            if (uploadedPhotoUrl) {
              data.photo = uploadedPhotoUrl;
            }

            const userFields: Record<string, unknown> | null = user;
            const finalUpdatedData = Object.entries(data).reduce<
              Record<string, unknown>
            >((acc, [fieldKey, newValue]) => {
              const oldValue = userFields?.[fieldKey];

              if (newValue === undefined && oldValue === undefined) return acc;
              if (newValue === undefined && oldValue === null) return acc;
              if (newValue === undefined && oldValue === '') return acc;
              if (newValue === null && oldValue === null) return acc;

              try {
                let normalizedOldValue: unknown = oldValue;
                const normalizedNewValue: unknown = newValue;

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
                    : // oxlint-disable-next-line typescript/no-base-to-string -- objects took the branch above
                      String(normalizedOldValue);

                const newValueStr =
                  typeof normalizedNewValue === 'object'
                    ? JSON.stringify(normalizedNewValue)
                    : // oxlint-disable-next-line typescript/no-base-to-string -- objects took the branch above
                      String(normalizedNewValue);

                if (oldValueStr !== newValueStr) {
                  acc[fieldKey] = newValue;
                }
              } catch {
                if (oldValue !== newValue) {
                  acc[fieldKey] = newValue;
                }
              }

              return acc;
            }, {});

            await postJson('/api/pow/edit/', {
              pows: pow,
            });

            await postJson('/api/user/edit/', { ...finalUpdatedData });

            router.refresh();

            setTimeout(() => {
              router.push(`/earn/t/${data.username}/`);
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
    } catch (error) {
      console.error('Error edit profile - ', error);
      toast.error('Failed to update profile.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <UpdateLocationConfirmModal
        isOpen={!!pendingProfileSubmit}
        newRegion={pendingProfileSubmit?.location || ''}
        onCancel={() => setPendingProfileSubmit(null)}
        onConfirm={() => {
          const data = pendingProfileSubmit;
          setPendingProfileSubmit(null);
          if (data) void submitProfile(data);
        }}
      />
      <div className="bg-white">
        <div className="mx-auto max-w-[600px] p-3 md:p-5">
          <Form {...form}>
            <h1 className="mt-3 mb-5 text-4xl font-bold">Edit Profile</h1>
            <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
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
                      <ImageUploader
                        source="user"
                        defaultValue={field.value || undefined}
                        onChange={(result) => {
                          setUploadedPhotoUrl(result.secureUrl);
                          field.onChange(result.secureUrl);
                        }}
                        onReset={() => {
                          setUploadedPhotoUrl(null);
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
                          // oxlint-disable-next-line react/incompatible-library -- react-hook-form's watch, as Earn reads it
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
                        excludeSanctioned
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
                            void trigger('skills');
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
                  isLoading && 'pointer-events-none opacity-50',
                )}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
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
    </>
  );
}
