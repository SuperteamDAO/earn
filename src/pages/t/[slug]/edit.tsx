import axios from 'axios';
import { Edit, Loader2, Plus, Trash } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';
import { toast } from 'sonner';

import { InputField } from '@/components/Form/InputField';
import { SelectBox } from '@/components/Form/SelectBox';
import { ImagePicker } from '@/components/shared/ImagePicker';
import { SkillSelect } from '@/components/shared/SkillSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  IndustryList,
  type MultiSelectOptions,
  web3Exp,
  workExp,
  workType,
} from '@/constants';
import { CommunityList } from '@/constants/communityList';
import { CountryList } from '@/constants/countryList';
import {
  AddProject,
  SocialInput,
  useUsernameValidation,
} from '@/features/talent';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { PoW } from '@/interface/pow';
import { skillSubSkillMap, type SubSkillsType } from '@/interface/skills';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { cn } from '@/utils';
import { uploadToCloudinary } from '@/utils/upload';
import { validateSolAddressUI } from '@/utils/validateSolAddress';

type FormData = {
  username: string;
  photo?: string;
  firstName?: string;
  lastName?: string;
  interests?: { value: string }[];
  bio?: string;
  twitter?: string;
  discord?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  telegram?: string;
  community?: { label: string; value: string }[];
  experience?: string;
  location?: string;
  cryptoExperience?: string;
  workPrefernce?: string;
  currentEmployer?: string;
  skills?: any;
  private: boolean;
  publicKey?: string;
};

const parseSkillsAndSubskills = (skillsObject: any) => {
  const skills: MultiSelectOptions[] = [];
  const subSkills: MultiSelectOptions[] = [];

  skillsObject.forEach((skillItem: { skills: string; subskills: string[] }) => {
    skills.push({ value: skillItem.skills, label: skillItem.skills });
    skillItem.subskills.forEach((subSkill) => {
      subSkills.push({ value: subSkill, label: subSkill });
    });
  });

  return { skills, subSkills };
};

const selectStyles = {
  control: (baseStyles: any) => ({
    ...baseStyles,
    border: '1px solid rgb(203 213 225)',
    '&:hover': {
      borderColor: 'rgb(203 213 225)',
    },
    boxShadow: 'none',
    backgroundColor: 'white',
  }),
};

export default function EditProfilePage({ slug }: { slug: string }) {
  const { user, refetchUser } = useUser();
  const { data: session, status } = useSession();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(true);

  const router = useRouter();
  const posthog = usePostHog();

  const [pow, setPow] = useState<PoW[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const editableFields = Object.keys(user || {}) as (keyof FormData)[];

  const animatedComponents = makeAnimated();
  const [DropDownValues, setDropDownValues] = useState<{
    interests: { label: string; value: string }[];
    community: { label: string; value: string }[];
  }>({
    interests: user?.interests ? JSON.parse(user?.interests) : [],
    community: user?.community ? JSON.parse(user.community) : [],
  });

  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);

  const privateValue = watch('private', user?.private);

  const { setUsername, isInvalid, validationErrorMessage } =
    useUsernameValidation();

  useEffect(() => {
    if (user) {
      editableFields.forEach((field) => {
        setValue(field, user[field]);
      });

      if (user.interests) {
        const interestsArray: string[] = JSON.parse(user.interests);
        const interestSelectValues = interestsArray.map((item) => ({
          label: item,
          value: item,
        }));
        setValue('interests', interestSelectValues);
        setDropDownValues((prev) => ({
          ...prev,
          interests: interestSelectValues,
        }));
      }

      if (user?.community) {
        const communityArray: string[] = JSON.parse(user.community);
        const communitySelectValues = communityArray.map((item) => ({
          label: item,
          value: item,
        }));
        setValue('community', communitySelectValues);
        setDropDownValues((prev) => ({
          ...prev,
          community: communitySelectValues,
        }));
      }

      if (user.experience) {
        setValue('experience', user.experience);
      }

      if (user.location) {
        setValue('location', user.location);
      }

      if (user.private) {
        setValue('private', user.private);
      }

      if (user?.skills && Array.isArray(user.skills)) {
        const { skills: parsedSkills, subSkills: parsedSubSkills } =
          parseSkillsAndSubskills(user.skills);
        setSkills(parsedSkills);
        setSubSkills(parsedSubSkills);
      }

      if (user?.photo) {
        setValue('photo', user.photo);
        setPhotoUrl(user.photo);
        setIsPhotoLoading(false);
      } else {
        setIsPhotoLoading(false);
      }

      if (user.publicKey) {
        setValue('publicKey', user.publicKey);
      }
    }
  }, [user, setValue]);

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

  const onSubmit = async (data: FormData) => {
    if (isInvalid) {
      return;
    }
    const socialFields = [
      'twitter',
      'github',
      'linkedin',
      'website',
      'telegram',
    ];
    const filledSocials = socialFields.filter(
      (field) => data[field as keyof FormData],
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
      const interestsArray = (data.interests || []).map((item) => item.value);
      const interestsJSON = JSON.stringify(interestsArray);

      const communityArray = (data.community || []).map((item) => item.value);
      const communityJSON = JSON.stringify(communityArray);

      const combinedSkills = skills.map((mainskill) => {
        const main =
          skillSubSkillMap[mainskill.value as keyof typeof skillSubSkillMap];
        const sub: SubSkillsType[] = [];

        subSkills.forEach((subskill) => {
          if (
            main &&
            main.some((subSkillObj) => subSkillObj.value === subskill.value)
          ) {
            sub.push(subskill.value as SubSkillsType);
          }
        });

        return {
          skills: mainskill.value,
          subskills: sub ?? [],
        };
      });

      const updatedData = {
        ...data,
        interests: interestsJSON,
        community: communityJSON,
        skills: combinedSkills,
      };

      const finalUpdatedData = Object.keys(updatedData).reduce((acc, key) => {
        const fieldKey = key as keyof FormData;
        if (user && updatedData[fieldKey] !== user[fieldKey]) {
          acc[fieldKey] = updatedData[fieldKey];
        }
        return acc;
      }, {} as Partial<FormData>);

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
    } catch (error: any) {
      toast.error('Failed to update profile.');
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
    <>
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
            <h1 className="mb-5 mt-3 text-2xl font-bold">Edit Profile</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              <p className="mb-5 mt-12 text-lg font-semibold text-slate-600">
                PERSONAL INFO
              </p>
              <FormItem className="mb-4">
                <FormLabel className="mb-1 pb-0 text-slate-500">
                  Profile Picture
                </FormLabel>
                {!isPhotoLoading && (
                  <ImagePicker
                    defaultValue={photoUrl ? { url: photoUrl } : undefined}
                    onChange={async (e) => {
                      setUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-pfp');
                      setValue('photo', a);
                      setUploading(false);
                    }}
                    onReset={() => {
                      setValue('photo', '');
                      setUploading(false);
                    }}
                  />
                )}
              </FormItem>
              <InputField
                label="Username"
                placeholder="Username"
                name="username"
                register={register}
                isRequired
                onChange={(e) => setUsername(e.target.value)}
                isInvalid={isInvalid}
                validationErrorMessage={validationErrorMessage}
                errors={errors}
              />

              <InputField
                label="First Name"
                placeholder="First Name"
                name="firstName"
                register={register}
                isRequired
                errors={errors}
              />

              <InputField
                label="Last Name"
                placeholder="Last Name"
                name="lastName"
                register={register}
                isRequired
                errors={errors}
              />

              <div className="mb-[1.25rem] w-full">
                <FormLabel className="text-slate-500">
                  Your One-Line Bio
                </FormLabel>
                <Textarea
                  className={cn(
                    'border-slate-300 placeholder:text-slate-300',
                    'focus:border-brand-purple focus:ring-brand-purple',
                  )}
                  id="bio"
                  maxLength={180}
                  placeholder="Here is a sample placeholder"
                  {...register('bio', { required: false })}
                />
                <p
                  className={cn(
                    'text-right text-xs',
                    (watch('bio')?.length || 0) > 160
                      ? 'text-red-500'
                      : 'text-slate-400',
                  )}
                >
                  {180 - (watch('bio')?.length || 0)} characters left
                </p>
              </div>
              <InputField
                label="Your Solana Wallet Address"
                placeholder="Wallet Address"
                name="publicKey"
                register={register}
                isRequired
                isInvalid={!!errors.publicKey}
                validate={(value: string) => {
                  return validateSolAddressUI(value);
                }}
                validationErrorMessage={validationErrorMessage}
                errors={errors}
              />
              <p className="mb-5 mt-12 text-lg font-semibold text-slate-600">
                SOCIALS
              </p>

              <SocialInput register={register} watch={watch} />

              <p className="mb-5 mt-12 text-lg font-semibold text-slate-600">
                WORK
              </p>

              <FormItem className="mb-5 w-full">
                <FormLabel className="text-slate-500">
                  What areas of Web3 are you most interested in?
                </FormLabel>
                <ReactSelect
                  closeMenuOnSelect={false}
                  components={animatedComponents}
                  isMulti
                  options={IndustryList.map((elm: string) => ({
                    label: elm,
                    value: elm,
                  }))}
                  value={DropDownValues.interests}
                  onChange={(selectedOptions: any) => {
                    const selectedInterests = selectedOptions
                      ? selectedOptions.map(
                          (elm: { label: string; value: string }) => elm,
                        )
                      : [];
                    setDropDownValues({
                      ...DropDownValues,
                      interests: selectedInterests,
                    });
                    setValue('interests', selectedInterests);
                  }}
                  styles={selectStyles}
                />
              </FormItem>

              <FormItem className="mb-5 w-full">
                <FormLabel className="text-slate-500">
                  Community Affiliations
                </FormLabel>
                <ReactSelect
                  closeMenuOnSelect={false}
                  components={animatedComponents}
                  isMulti
                  options={CommunityList.map((elm: string) => ({
                    label: elm,
                    value: elm,
                  }))}
                  value={DropDownValues.community}
                  onChange={(e: any) => {
                    const selectedCommunities = e
                      ? e.map((elm: { label: string; value: string }) => elm)
                      : [];
                    setDropDownValues({
                      ...DropDownValues,
                      community: selectedCommunities,
                    });
                    setValue('community', selectedCommunities);
                  }}
                  styles={selectStyles}
                />
              </FormItem>

              <SelectBox
                label="Work Experience"
                watchValue={watch('experience')}
                options={workExp}
                id="experience"
                placeholder="Pick Your Experience"
                register={register}
              />

              <SelectBox
                label="Location"
                watchValue={watch('location')}
                options={CountryList}
                id="location"
                placeholder="Select Your Country"
                register={register}
              />

              <SelectBox
                label="How familiar are you with Web3?"
                watchValue={watch('cryptoExperience')}
                options={web3Exp}
                id="cryptoExperience"
                placeholder="Pick your Experience"
                register={register}
              />

              <SelectBox
                label="Work Preference"
                watchValue={watch('workPrefernce')}
                options={workType}
                id="workPrefernce"
                placeholder="Type of Work"
                register={register}
              />

              <InputField
                label="Current Employer"
                placeholder="Employer"
                name="currentEmployer"
                register={register}
                errors={errors}
              />

              <FormLabel className="text-slate-500">Proof of Work</FormLabel>
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
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>

              <SkillSelect
                skills={skills}
                subSkills={subSkills}
                setSkills={setSkills}
                setSubSkills={setSubSkills}
                skillLabel="Your Skills"
                subSkillLabel="Sub Skills"
                helperText="We will send email notifications of new listings for your selected skills"
              />

              <div className="mb-8">
                <Checkbox
                  checked={privateValue}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setValue('private', checked);
                    }
                  }}
                  className="mr-1 text-brand-purple data-[state=checked]:border-brand-purple data-[state=checked]:bg-brand-purple"
                >
                  <span className="font-medium text-slate-500">
                    Keep my info private
                  </span>
                </Checkbox>
              </div>
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
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};
