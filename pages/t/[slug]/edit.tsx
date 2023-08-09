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
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import { AddProject } from '@/components/Form/AddProject';
import { InputField } from '@/components/Form/InputField';
import { SelectBox } from '@/components/Form/SelectBox';
import { SocialInput } from '@/components/Form/SocialInput';
import { SkillSelect } from '@/components/misc/SkillSelect';
import { socials } from '@/components/Talent/YourLinks';
import type { MultiSelectOptions } from '@/constants';
import {
  CommunityList,
  CountryList,
  IndustryList,
  web3Exp,
  workExp,
  workType,
} from '@/constants';
import type { SubSkillsType } from '@/interface/skills';
import { SkillList } from '@/interface/skills';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';
import { isUsernameAvailable } from '@/utils/username';

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
  pow?: string;
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

const keysToOmit = [
  'id',
  'publicKey',
  'email',
  'createdAt',
  'isVerified',
  'role',
  'totalEarnedInUSD',
  'isTalentFilled',
  'superteamLevel',
  'notifications',
  'currentSponsorId',
  'UserSponsors',
  'currentSponsor',
  'poc',
  'Comment',
  'Submission',
  'Grants',
  'UserInvites',
  'SubscribeBounty',
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

export default function EditProfilePage() {
  const { userInfo, setUserInfo } = userStore();
  const { register, handleSubmit, setValue, watch } = useForm<FormData>();

  const [userNameValid, setUserNameValid] = useState(true);
  const [discordError, setDiscordError] = useState(false);
  const [socialError, setSocialError] = useState(false);
  const router = useRouter();

  const [pow, setPow] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const editableFields = Object.keys(userInfo || {}) as (keyof FormData)[];

  const animatedComponents = makeAnimated();
  const [DropDownValues, setDropDownValues] = useState<{
    interests: string;
    community: { label: string; value: string }[];
  }>({
    interests: JSON.stringify(userInfo?.interests || []),
    community: userInfo?.community ? JSON.parse(userInfo.community) : [],
  });

  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (userInfo) {
      editableFields.forEach((field) => {
        setValue(field, userInfo[field]);
      });

      if (userInfo.interests) {
        const interestsArray = JSON.parse(userInfo.interests);
        const defaultInterests = interestsArray.map((value: string) =>
          IndustryList.find((option) => option.value === value)
        );
        setValue('interests', defaultInterests);
        setDropDownValues((prev) => ({
          ...prev,
          interests: defaultInterests,
        }));
      }

      if (userInfo?.community) {
        const communityArray: string[] = JSON.parse(userInfo.community);
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

      if (userInfo.experience) {
        setValue('experience', userInfo.experience);
      }

      if (userInfo.location) {
        setValue('location', userInfo.location);
      }

      if (userInfo.pow) {
        const powData = JSON.parse(userInfo.pow);
        setPow(Array.isArray(powData) ? powData : [powData]);
      }

      if (userInfo?.skills && Array.isArray(userInfo.skills)) {
        const { skills: parsedSkills, subSkills: parsedSubSkills } =
          parseSkillsAndSubskills(userInfo.skills);
        setSkills(parsedSkills);
        setSubSkills(parsedSubSkills);
      }
    }
  }, [userInfo, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      if (data.username !== userInfo?.username) {
        const avl = await isUsernameAvailable(data.username);
        if (!avl) {
          setUserNameValid(false);
          return;
        }
      }
      setUserNameValid(true);

      if (!data.discord) {
        setDiscordError(true);
        return;
      }
      setDiscordError(false);

      const filledSocialLinksCount = socialLinkFields.filter(
        (field) => data[field as keyof FormData]
      ).length;

      setSocialError(filledSocialLinksCount < 1);

      if (filledSocialLinksCount < 1) {
        return;
      }

      const interestsJSON = JSON.stringify(
        (data.interests || []).map((interest) => interest.value)
      );

      const communityArray = (data.community || []).map((item) => item.value);
      const communityJSON = JSON.stringify(communityArray);

      const combinedSkills = skills.map((mainskill) => {
        const main = SkillList.find(
          (skill) => skill.mainskill === mainskill.value
        );
        const sub: SubSkillsType[] = [];

        subSkills.forEach((subskill) => {
          if (
            main &&
            main.subskills.includes(subskill.value as SubSkillsType)
          ) {
            sub.push(subskill.value as SubSkillsType);
          }
        });

        return {
          skills: main?.mainskill ?? '',
          subskills: sub ?? [],
        };
      });

      const updatedData = {
        ...data,
        interests: interestsJSON,
        community: communityJSON,
        pow: JSON.stringify(pow),
        skills: combinedSkills,
      };

      const finalUpdatedData = Object.keys(updatedData).reduce((acc, key) => {
        const fieldKey = key as keyof FormData;
        if (
          userInfo &&
          updatedData[fieldKey] !== userInfo[fieldKey] &&
          !keysToOmit.includes(key)
        ) {
          acc[fieldKey] = updatedData[fieldKey];
        }
        return acc;
      }, {} as Partial<FormData>);

      const response = await axios.post('/api/user/edit', {
        id: userInfo?.id,
        ...finalUpdatedData,
      });
      setUserInfo(response.data);
      console.log('Profile updated successfully!');
      toast({
        title: 'Profile updated.',
        description: 'Your profile has been updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setTimeout(() => {
        router.push(`/t/${userInfo?.username}`);
      }, 500);
    } catch (error: any) {
      console.log('Failed to update profile');
    }
  };

  return (
    <>
      <Default
        meta={
          <Meta
            title="Superteam Earn"
            description="Every Solana opportunity in one place!"
            canonical="/assets/logo/og.svg"
          />
        }
      >
        <Box bg="#fff">
          <Box w="90%" maxW="600px" mx="auto" p={5}>
            <Heading mt={3} mb={5}>
              Edit Profile
            </Heading>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl>
                <Text mt={12} mb={5} fontSize="xl">
                  Personal Info
                </Text>
                <InputField
                  label="Username"
                  placeholder="Username"
                  name="username"
                  register={register}
                  isInvalid={!userNameValid}
                  onChange={() => setUserNameValid(true)}
                  validationErrorMessage="Username is unavailable! Please try another one."
                  isRequired
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

                <Text mt={8} mb={5} fontSize="xl">
                  Socials
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
                    />
                  );
                })}
                {socialError && (
                  <Text color="red">At least one social link is required!</Text>
                )}

                <Text mt={8} mb={5} fontSize="xl">
                  Work
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
                            (elm: { label: string; value: string }) => elm
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
                  {pow.map((ele, idx) => {
                    const data = JSON.parse(ele);
                    return (
                      <Flex
                        key={data.title}
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
                              setPow((elem) => {
                                return [
                                  ...elem.filter((_ele, id) => idx !== id),
                                ];
                              });
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
                />

                <Checkbox
                  mr={1}
                  color="brand.slate.500"
                  fontWeight={500}
                  colorScheme="purple"
                  size="md"
                  {...register('private')}
                  mb={8}
                >
                  Keep my info private
                </Checkbox>
                <br />

                <Button mb={12} type="submit">
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
