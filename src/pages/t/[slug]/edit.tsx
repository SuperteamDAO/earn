import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import { AddProject } from '@/components/Form/AddProject';
import { InputField } from '@/components/Form/InputField';
import { SelectBox } from '@/components/Form/SelectBox';
import { SocialInput } from '@/components/Form/SocialInput';
import { SkillSelect } from '@/components/misc/SkillSelect';
import { ImagePicker } from '@/components/shared/ImagePicker';
import { socials } from '@/components/Talent/YourLinks';
import {
  CommunityList,
  CountryList,
  IndustryList,
  type MultiSelectOptions,
  web3Exp,
  workExp,
  workType,
} from '@/constants';
import type { PoW } from '@/interface/pow';
import { skillSubSkillMap, type SubSkillsType } from '@/interface/skills';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';
import { useUsernameValidation } from '@/utils/useUsernameValidation';

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
};

const socialLinkFields = [
  'twitter',
  'github',
  'linkedin',
  'website',
  'telegram',
];

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

export default function EditProfilePage({ slug }: { slug: string }) {
  const { user, refetchUser } = useUser();
  const { data: session, status } = useSession();
  const { register, handleSubmit, setValue, watch } = useForm<FormData>();

  const [discordError, setDiscordError] = useState(false);
  const [socialError, setSocialError] = useState(false);
  const [isAnySocialUrlInvalid, setAnySocialUrlInvalid] = useState(false);
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
    interests: string;
    community: { label: string; value: string }[];
  }>({
    interests: JSON.stringify(user?.interests || []),
    community: user?.community ? JSON.parse(user.community) : [],
  });

  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);
  const toast = useToast();

  const privateValue = watch('private', user?.private);

  const socialLinksValidityRef = useRef<{ [key: string]: boolean }>({});

  const handleUrlValidation = (isValid: boolean, field: keyof FormData) => {
    socialLinksValidityRef.current[field] = isValid;

    const allUrlsValid = socialLinkFields.every(
      (f) => socialLinksValidityRef.current[f as keyof FormData],
    );

    setAnySocialUrlInvalid(!allUrlsValid);
  };

  const { setUsername, isInvalid, validationErrorMessage } =
    useUsernameValidation();

  useEffect(() => {
    if (user) {
      editableFields.forEach((field) => {
        setValue(field, user[field]);
      });

      if (user.interests) {
        const interestsArray = JSON.parse(user.interests);
        const defaultInterests = interestsArray.map((value: string) =>
          IndustryList.find((option) => option.value === value),
        );
        setValue('interests', defaultInterests);
        setDropDownValues((prev) => ({
          ...prev,
          interests: defaultInterests,
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
    posthog.capture('confirm_edit profile');
    if (isInvalid) {
      return;
    }
    setIsLoading(true);
    try {
      if (!data.discord) {
        setDiscordError(true);
        toast({
          title: 'Discord Error.',
          description: 'Discord field is required.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          variant: 'subtle',
        });
        return;
      }
      setDiscordError(false);

      const filledSocialLinksCount = socialLinkFields.filter(
        (field) => data[field as keyof FormData],
      ).length;

      setSocialError(filledSocialLinksCount < 1);

      if (filledSocialLinksCount < 1) {
        toast({
          title: 'Social Links Error.',
          description: 'At least one social link is required.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          variant: 'subtle',
        });
        return;
      }

      if (isAnySocialUrlInvalid) {
        toast({
          title: 'Social URLs Error.',
          description: 'One or more social URLs are invalid.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          variant: 'subtle',
        });
        return;
      }

      const interestsJSON = JSON.stringify(
        (data.interests || []).map((interest) => interest.value),
      );

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

      await axios.post('/api/pow/edit', {
        pows: pow,
      });

      await axios.post('/api/user/edit', { ...finalUpdatedData });

      await refetchUser();

      setIsLoading(false);

      toast({
        title: 'Profile updated.',
        description: 'Your profile has been updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
        variant: 'subtle',
      });
      setTimeout(() => {
        router.push(`/t/${data.username}`);
      }, 500);
    } catch (error: any) {
      toast({
        title: 'Failed to update profile.',
        description:
          'There might be a field with invalid input. Please rectify and then click on "Update"',
        status: 'error',
        duration: 5000,
        isClosable: true,
        variant: 'subtle',
      });
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
        <Box bg="#fff">
          <Box maxW="600px" mx="auto" p={{ base: 3, md: 5 }}>
            <Heading mt={3} mb={5}>
              Edit Profile
            </Heading>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl>
                <Text
                  mt={12}
                  mb={5}
                  color={'brand.slate.600'}
                  fontSize="lg"
                  fontWeight={600}
                  letterSpacing={0.4}
                >
                  PERSONAL INFO
                </Text>
                <Box mb={4}>
                  <FormLabel
                    mb={'1'}
                    pb={'0'}
                    color={'brand.slate.500'}
                    requiredIndicator={<></>}
                  >
                    Profile Picture
                  </FormLabel>
                  {isPhotoLoading ? (
                    <></>
                  ) : photoUrl ? (
                    <ImagePicker
                      defaultValue={{ url: photoUrl, type: 'image' }}
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
                  ) : (
                    <ImagePicker
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
                </Box>
                <InputField
                  label="Username"
                  placeholder="Username"
                  name="username"
                  register={register}
                  isRequired
                  onChange={(e) => setUsername(e.target.value)}
                  isInvalid={isInvalid}
                  validationErrorMessage={validationErrorMessage}
                />

                <InputField
                  label="First Name"
                  placeholder="First Name"
                  name="firstName"
                  register={register}
                  isRequired
                />

                <InputField
                  label="Last Name"
                  placeholder="Last Name"
                  name="lastName"
                  register={register}
                  isRequired
                />

                <Box w={'full'} mb={'1.25rem'}>
                  <FormLabel color={'brand.slate.500'}>
                    Your One-Line Bio
                  </FormLabel>
                  <Textarea
                    borderColor="brand.slate.300"
                    _placeholder={{
                      color: 'brand.slate.300',
                    }}
                    focusBorderColor="brand.purple"
                    id={'bio'}
                    maxLength={180}
                    placeholder="Here is a sample placeholder"
                    {...register('bio', { required: true })}
                  />
                  <Text
                    color={
                      (watch('bio')?.length || 0) > 160
                        ? 'red'
                        : 'brand.slate.400'
                    }
                    fontSize={'xs'}
                    textAlign="right"
                  >
                    {180 - (watch('bio')?.length || 0)} characters left
                  </Text>
                </Box>

                <Text
                  mt={12}
                  mb={5}
                  color={'brand.slate.600'}
                  fontSize="lg"
                  fontWeight={600}
                  letterSpacing={0.4}
                >
                  SOCIALS
                </Text>

                {socials.map((sc, idx: number) => {
                  return (
                    <SocialInput
                      name={sc.label.toLowerCase()}
                      register={register}
                      {...sc}
                      key={`sc${idx}`}
                      discordError={
                        sc.label.toLowerCase() === 'discord'
                          ? discordError
                          : false
                      }
                      watch={watch}
                      onUrlValidation={(isValid) => {
                        handleUrlValidation(
                          isValid,
                          sc.label.toLowerCase() as keyof FormData,
                        );
                      }}
                    />
                  );
                })}
                {socialError && (
                  <Text color="red">At least one social link is required!</Text>
                )}

                <Text
                  mt={12}
                  mb={5}
                  color={'brand.slate.600'}
                  fontSize="lg"
                  fontWeight={600}
                  letterSpacing={0.4}
                >
                  WORK
                </Text>

                <Box w={'full'} mb={'1.25rem'}>
                  <FormLabel color={'brand.slate.500'}>
                    What areas of Web3 are you most interested in?
                  </FormLabel>
                  <ReactSelect
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    isMulti
                    options={IndustryList as any}
                    value={DropDownValues.interests}
                    required
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
                    styles={{
                      control: (baseStyles) => ({
                        ...baseStyles,
                        backgroundColor: 'brand.slate.500',
                        borderColor: 'brand.slate.300',
                      }),
                    }}
                  />
                </Box>

                <Box w={'full'} mb={'1.25rem'}>
                  <FormLabel color={'brand.slate.500'}>
                    Community Affiliations
                  </FormLabel>
                  <ReactSelect
                    closeMenuOnSelect={false}
                    components={animatedComponents}
                    isMulti
                    options={CommunityList.map((elm: string) => {
                      return { label: elm, value: elm };
                    })}
                    value={DropDownValues.community}
                    required
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
                    styles={{
                      control: (baseStyles) => ({
                        ...baseStyles,
                        backgroundColor: 'brand.slate.500',
                        borderColor: 'brand.slate.300',
                      }),
                    }}
                  />
                </Box>

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
                  isRequired
                />

                <FormLabel color={'brand.slate.500'}>Proof of Work</FormLabel>
                <Box>
                  {pow.map((data, idx) => {
                    return (
                      <Flex
                        key={data.id}
                        align={'center'}
                        mt="2"
                        mb={'1.5'}
                        px={'1rem'}
                        py={'0.5rem'}
                        color={'brand.slate.500'}
                        border={'1px solid gray'}
                        borderColor="brand.slate.300"
                        rounded={'md'}
                      >
                        <Text w={'full'} color={'gray.800'} fontSize={'0.8rem'}>
                          {data.title}
                        </Text>
                        <Center columnGap={'0.8rem'}>
                          <EditIcon
                            onClick={() => {
                              setSelectedProject(idx);
                              onOpen();
                            }}
                            cursor={'pointer'}
                            fontSize={'0.8rem'}
                          />
                          <DeleteIcon
                            onClick={() => {
                              setPow((prevPow) =>
                                prevPow.filter((_ele, id) => idx !== id),
                              );
                            }}
                            cursor={'pointer'}
                            fontSize={'0.8rem'}
                          />
                        </Center>
                      </Flex>
                    );
                  })}
                </Box>
                <Button
                  w={'full'}
                  mb={8}
                  leftIcon={<AddIcon />}
                  onClick={() => {
                    onOpen();
                  }}
                  variant="outline"
                >
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

                <Checkbox
                  mr={1}
                  mb={8}
                  color="brand.slate.500"
                  fontWeight={500}
                  colorScheme="purple"
                  isChecked={privateValue}
                  onChange={(e) => {
                    setValue('private', e.target.checked);
                  }}
                  size="md"
                >
                  Keep my info private
                </Checkbox>
                <br />

                <Button
                  className="ph-no-capture"
                  mb={12}
                  isLoading={uploading || isLoading}
                  type="submit"
                >
                  Update Profile
                </Button>
              </FormControl>
            </form>
          </Box>
        </Box>
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
