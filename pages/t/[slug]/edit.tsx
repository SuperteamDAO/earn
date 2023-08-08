import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import { AddProject } from '@/components/Form/AddProject';
import { InputField } from '@/components/Form/InputField';
import { SelectBox } from '@/components/Form/SelectBox';
import { SocialInput } from '@/components/Form/SocialInput';
import { socials } from '@/components/Talent/YourLinks';
import {
  CommunityList,
  CountryList,
  IndustryList,
  web3Exp,
  workExp,
  workType,
} from '@/constants';
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
};

const socialLinkFields = [
  'twitter',
  'github',
  'linkedin',
  'website',
  'telegram',
];

const keysToOmit = [
  'UserSponsors',
  'currentSponsor',
  'poc',
  'Comment',
  'Submission',
  'Grants',
  'UserInvites',
  'SubscribeBounty',
  'notifications',
];

const EditProfilePage: React.FC = () => {
  const { userInfo, setUserInfo } = userStore();
  const { register, handleSubmit, setValue, watch } = useForm<FormData>();

  const [userNameValid, setUserNameValid] = useState(true);
  const [discordError, setDiscordError] = useState(false);
  const [socialError, setSocialError] = useState(false);

  const [pow, setPow] = useState<any[]>([]);
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

      const updatedData = {
        ...data,
        interests: interestsJSON,
        community: communityJSON,
        pow: JSON.stringify(pow),
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
    } catch (error: any) {
      console.log('Failed to update profile, error:', error?.response?.data);
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
        <Box p={5}>
          <Heading mb={5}>Edit Profile</Heading>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl>
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

              <FormLabel>Proof of Work</FormLabel>
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
                      borderColor={'gray.200'}
                      rounded={'md'}
                    >
                      <Text w={'full'} fontSize={'0.8rem'}>
                        {data.title}
                      </Text>
                      <Center columnGap={'0.8rem'}>
                        {/* <EditIcon onClick={() => { setselectedProject(idx) }} cursor={"pointer"} fontSize={"0.8rem"} /> */}
                        <DeleteIcon
                          onClick={() => {
                            setPow((elem) => {
                              return [...elem.filter((_ele, id) => idx !== id)];
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

              <FormLabel>Skills</FormLabel>
              <Input {...register('skills')} />

              <Button type="submit">Update Profile</Button>
            </FormControl>
          </form>
        </Box>
        <AddProject
          key={`${pow.length}project`}
          {...{ isOpen, onClose, pow, setPow }}
        />
      </Default>
    </>
  );
};

export default EditProfilePage;
