import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Edit, Info, Loader2, Plus, Trash } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
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
import { FormFieldSelect } from '@/components/ui/form-field-select';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip } from '@/components/ui/tooltip';
import { CountryList } from '@/constants/countryList';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { PoW } from '@/interface/pow';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { uploadToCloudinary } from '@/utils/upload';

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
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

export default function EditProfilePage({ slug }: { slug: string }) {
  const { user, refetchUser } = useUser();
  const { data: session, status } = useSession();
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
  });
  const { control, handleSubmit, watch, setError, clearErrors, trigger } = form;

  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
  const posthog = usePostHog();

  const [pow, setPow] = useState<PoW[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const { setUsername, isInvalid, validationErrorMessage } =
    useUsernameValidation();

  useEffect(() => {
    if (isInvalid && !!validationErrorMessage) {
      setError('username', {
        message: validationErrorMessage,
      });
    } else clearErrors('username');
  }, [validationErrorMessage, isInvalid]);

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
        publicKey: user.publicKey || undefined,
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
    }
  }, [user]);

  useEffect(() => {
    const fetchPoW = async () => {
      try {
        const response = await axios.get('/api/pow/get', {
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
      console.log('data pre filter', data);
      const finalUpdatedData = Object.keys(data).reduce((acc, key) => {
        const fieldKey = key as keyof ProfileFormData;
        if (
          user &&
          JSON.stringify(data[fieldKey]) !== JSON.stringify(user[fieldKey])
        ) {
          acc[fieldKey] = data[fieldKey] as any;
        }
        return acc;
      }, {} as Partial<ProfileFormData>);

      console.log('final updated data', finalUpdatedData);
      toast.promise(
        async () => {
          await axios.post('/api/pow/edit', {
            pows: pow,
          });

          await axios.post('/api/user/edit', { ...finalUpdatedData });

          await refetchUser();

          setIsLoading(false);

          setTimeout(() => {
            router.push(`/t/${data.username}`);
          }, 500);
        },
        {
          loading: 'Updating your profile...',
          success: 'Your profile has been updated successfully!',
          error: 'Failed to update profile.',
        },
      );
      return true;
    } catch (error: any) {
      setIsLoading(false);
      toast.error('Failed to update profile.');
      return false;
    }
  };

  useEffect(() => {
    if (user && slug !== user?.username) {
      router.push(`/t/${slug}`);
    }
  }, [slug, router, user]);

  if (!session && status === 'unauthenticated') {
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
            <h1 className="mb-5 mt-3 text-4xl font-bold">Edit Profile</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              <p className="mb-5 mt-12 text-lg font-semibold text-slate-600">
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
                        onChange={async (e) => {
                          setUploading(true);
                          const a = await uploadToCloudinary(e, 'earn-pfp');
                          field.onChange(a);
                          setUploading(false);
                        }}
                        onReset={() => {
                          field.onChange('');
                          setUploading(false);
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
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-'); // Replace spaces with dashes
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

              <FormFieldWrapper
                className="mb-5"
                label="Your Solana Wallet Address"
                name="publicKey"
                control={control}
                isRequired
              >
                <Input placeholder="Wallet Address" />
              </FormFieldWrapper>

              <p className="mb-5 mt-12 text-lg font-semibold text-slate-600">
                SOCIALS
              </p>

              <SocialInputAll control={control} />

              <p className="mb-5 mt-12 text-lg font-semibold text-slate-600">
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

              <FormFieldSelect
                label="Work Experience"
                options={workExp}
                name="experience"
                placeholder="Pick Your Experience"
                control={control}
              />

              <FormFieldSelect
                label="Location"
                options={CountryList}
                name="location"
                placeholder="Select Your Country"
                control={control}
              />

              <FormFieldSelect
                label="How familiar are you with Web3?"
                options={web3Exp}
                name="cryptoExperience"
                placeholder="Pick your Experience"
                control={control}
              />

              <FormFieldSelect
                label="Work Preference"
                options={workType}
                name="workPrefernce"
                placeholder="Type of Work"
                control={control}
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
                      className="mb-1.5 mt-2 flex items-center rounded-md border border-slate-300 px-[1rem] py-[0.5rem] text-slate-500"
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
                          key={JSON.stringify(field.value)}
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
                          className="mr-1 text-brand-purple data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
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
