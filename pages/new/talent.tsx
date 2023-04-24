/* eslint-disable no-param-reassign */
import { AddIcon, DeleteIcon, LinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  PinInput,
  PinInputField,
  Select,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { MediaPicker } from 'degen';
import type { Dispatch, SetStateAction } from 'react';
import React, { useEffect, useState } from 'react';
import type { FieldValues, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';
import { create } from 'zustand';

import { SkillSelect } from '../../components/misc/SkillSelectTalent';
import { Steps } from '../../components/misc/steps';
import { Navbar } from '../../components/navbar/navbar';
import TalentBio from '../../components/TalentBio';
import type { MultiSelectOptions } from '../../constants';
import {
  CommunityList,
  CountryList,
  IndustryList,
  web3Exp,
  workExp,
  workType,
} from '../../constants';
import { ConnectWallet } from '../../layouts/connectWallet';
// layouts
import { userStore } from '../../store/user';
import { generateOtp } from '../../utils/functions';
import {
  generateCode,
  generateCodeLast,
  genrateuuid,
} from '../../utils/helpers';
import { uploadToCloudinary } from '../../utils/upload';

interface AboutYouType {
  bio: string;
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  location: string;
  avatar: string;
}

interface WorkType {
  experience: string;
  cryptoExperience: string;
  currentEmployer: string;
  community: string;
  interests: string;
  skills: string;
  subskills: string;
  workPrefernce: string;
}

interface Links {
  twitter: string;
  github: string;
  linkedin: string;
  website: string;
  telegram: string;
  pow: string;
}

interface UserStoreType {
  otp: number | undefined;
  setOtp: (data: number) => void;
  emailVerified: boolean;
  verifyEmail: () => void;
  form: AboutYouType & WorkType & Links;
  updateState: (
    data: AboutYouType | WorkType | Links | { email: string }
  ) => void;
}

const useFormStore = create<UserStoreType>()((set) => ({
  form: {
    bio: '',
    email: '',
    firstname: '',
    lastname: '',
    username: '',
    location: '',
    avatar: '',
    experience: '',
    cryptoExperience: '',
    currentEmployer: '',
    community: '',
    interests: '',
    skills: '',
    subskills: '',
    workPrefernce: '',
    twitter: '',
    github: '',
    linkedin: '',
    website: '',
    telegram: '',
    pow: '',
  },
  otp: undefined,
  setOtp: (data) => {
    set((state) => {
      state.otp = data;
      return { ...state };
    });
  },
  emailVerified: false,
  verifyEmail: () => {
    set((state) => {
      state.emailVerified = true;
      return { ...state };
    });
  },
  updateState: (data) => {
    set((state) => {
      state.form = { ...state.form, ...data };
      return { ...state };
    });
  },
}));

type Step1Props = {
  setStep: Dispatch<SetStateAction<number>>;
};

const userNameAvailable = async (term: string) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/talent/check?username=${term}`
    );
    if (res.status === 204) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const AboutYou = ({ setStep }: Step1Props) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadLoading, setuploadLoading] = useState<boolean>(false);
  const [userNameValid, setuserNameValid] = useState(true);

  const { updateState, form, emailVerified } = useFormStore();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      email: form.email,
      firstname: form.firstname,
      lastname: form.lastname,
      username: form.username,
      location: form.location,
      avatar: form.avatar,
      bio: form.bio,
    },
  });

  const onSubmit = async (data: any) => {
    if (data.username) {
      const avl = await userNameAvailable(data.username);
      if (!avl) {
        setuserNameValid(false);
        return false;
      }
    }
    updateState({ ...data, avatar: imageUrl });
    setStep((i) => i + 1);
    return null;
  };

  return (
    <Box w={'full'}>
      <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
        <FormControl w="full" mb={5} isRequired>
          <VStack align={'start'} gap={2} rowGap={'0'} mb={'25px'} my={3}>
            <FormLabel
              mb={'0'}
              pb={'0'}
              color={'gray.600'}
              requiredIndicator={<></>}
            >
              Profile Picture
            </FormLabel>
            <MediaPicker
              onChange={async (e) => {
                setuploadLoading(true);
                const a = await uploadToCloudinary(e);
                console.log(a);
                setImageUrl(a);
                setuploadLoading(false);
              }}
              compact
              label="Choose or drag and drop media"
            />
          </VStack>
          <Flex gap={'1.25rem'} w={'full'} mb={'1.25rem'} outline={'0.3125rem'}>
            <Box w={'full'}>
              <FormLabel color={'gray.600'}>First Name</FormLabel>
              <Input
                color={'gray.800'}
                _placeholder={{ color: 'gray.500' }}
                id="firstname"
                placeholder="Your first name"
                {...register('firstname', { required: true })}
              />
            </Box>
            <Box w={'full'}>
              <FormLabel color={'gray.600'}>Last Name</FormLabel>
              <Input
                color={'gray.800'}
                _placeholder={{ color: 'gray.500' }}
                id="lastname"
                placeholder="Your last name"
                {...register('lastname', { required: true })}
              />
            </Box>
          </Flex>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'gray.600'}>Email</FormLabel>
            <Input
              color={'gray.800'}
              _placeholder={{ color: 'gray.500' }}
              id="email"
              placeholder="Email Address"
              type={'email'}
              {...register('email', { required: true })}
              disabled={emailVerified}
            />
          </Box>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'gray.600'}>Username</FormLabel>
            <Input
              color={'gray.800'}
              _placeholder={{ color: 'gray.500' }}
              id="username"
              placeholder="Username"
              {...register('username', { required: true })}
              isInvalid={!userNameValid}
            />
            {!userNameValid && (
              <Text color={'red'}>
                Username is unavailable ! Please try another Username
              </Text>
            )}
          </Box>

          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'gray.600'}>Location</FormLabel>
            <Select
              color={watch().location.length === 0 ? 'gray.500' : ''}
              id={'location'}
              placeholder="Select your Country"
              {...register('location', { required: true })}
            >
              {CountryList.map((ct) => {
                return (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                );
              })}
            </Select>
          </Box>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'gray.600'}>Your One-Line Bio</FormLabel>
            <Textarea
              id={'bio'}
              placeholder="Here is a sample placeholder"
              {...register('bio', { required: true })}
            />
          </Box>
          <Button
            w={'full'}
            h="50px"
            color={'white'}
            bg={'rgb(101, 98, 255)'}
            isLoading={uploadLoading}
            spinnerPlacement="start"
            type="submit"
          >
            Continue
          </Button>
        </FormControl>
      </form>
    </Box>
  );
};

const YourWork = ({ setStep }: Step1Props) => {
  const animatedComponents = makeAnimated();

  const [skills, setskills] = useState<MultiSelectOptions[]>([]);
  const [subskills, setsubskills] = useState<MultiSelectOptions[]>([]);

  const [DropDownValues, setDropDownValues] = useState({
    community: '',
    interests: '',
  });

  const { updateState } = useFormStore();
  const { form } = useFormStore();

  const [post, setpost] = useState(false);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      experience: form.experience,
      cryptoExperience: form.cryptoExperience,
      currentEmployer: form.currentEmployer,
      community: form.community,
      workPrefernce: form.workPrefernce,
    },
  });

  const onSubmit = (data: any) => {
    setpost(true);
    if (
      skills.length === 0 ||
      subskills.length === 0 ||
      DropDownValues.interests.length === 0 ||
      DropDownValues.community.length === 0
    ) {
      return false;
    }
    // totdo
    updateState({
      ...data,
      skills: JSON.stringify(skills.map((ele) => ele.value)),
      subskills: JSON.stringify(subskills.map((ele) => ele.value)),
      ...DropDownValues,
    });
    setStep((i) => i + 1);
    return true;
  };

  useEffect(() => {
    try {
      if (form.skills.length > 2) {
        const skillsJson = JSON.parse(form.skills);
        setskills((sk) => {
          return [
            ...sk,
            ...skillsJson.map((ele: string) => {
              return {
                label: ele,
                value: ele,
              };
            }),
          ];
        });
      }
      if (form.subskills.length > 2) {
        const subskillsJson = JSON.parse(form.subskills);
        setsubskills((sk) => {
          return [
            ...sk,
            ...subskillsJson.map((ele: string) => {
              return {
                label: ele,
                value: ele,
              };
            }),
          ];
        });
      }
    } catch (error) {
      console.log('file: talent.tsx:395 ~ useEffect ~ error:', error);
    }
  }, []);

  return (
    <Box w={'full'}>
      <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
        <FormControl w="full" mb={5} isRequired>
          <Flex gap={'1.25rem'} w={'full'} mb={'1.25rem'} outline={'0.3125rem'}>
            <Box w={'full'}>
              <FormLabel color={'gray.600'}>
                How familiar are you with Web3?
              </FormLabel>

              <Select
                color={watch().cryptoExperience.length === 0 ? 'gray.500' : ''}
                id="cryptoExperience"
                placeholder="Pick your Experience"
                {...register('cryptoExperience', { required: true })}
              >
                {web3Exp.map((ct) => {
                  return (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  );
                })}
              </Select>
            </Box>
            <Box w={'full'}>
              <FormLabel color={'gray.600'}>Work Experience</FormLabel>
              <Select
                color={watch().experience.length === 0 ? 'gray.500' : ''}
                id="experience"
                placeholder="Pick your experience"
                {...register('experience', { required: true })}
              >
                {workExp.map((ct) => {
                  return (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  );
                })}
              </Select>
            </Box>
          </Flex>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'gray.600'}>Work Preference</FormLabel>
            <Select
              color={watch().workPrefernce.length === 0 ? 'gray.500' : ''}
              id="workPrefernce"
              placeholder="Type of work"
              {...register('workPrefernce', { required: true })}
            >
              {workType.map((ct) => {
                return (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                );
              })}
            </Select>
          </Box>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'gray.600'}>Current Employer</FormLabel>
            <Input
              color={'gray.800'}
              _placeholder={{ color: 'gray.500' }}
              id="currentEmployer"
              placeholder="Current Employer"
              {...register('currentEmployer', { required: true })}
            />
          </Box>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'gray.600'}>Community Affiliations</FormLabel>
            <ReactSelect
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              options={CommunityList.map((elm: string) => {
                return { label: elm, value: elm };
              })}
              required
              onChange={(e: any) => {
                setDropDownValues((st) => {
                  st.community = JSON.stringify(
                    e.map((elm: { label: string; value: string }) => elm.value)
                  );
                  return { ...st };
                });
              }}
              styles={{
                control: (baseStyles) => ({
                  ...baseStyles,
                  border:
                    DropDownValues.community.length === 0 && post
                      ? '2px solid red'
                      : baseStyles.border,
                }),
              }}
            />
          </Box>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'gray.600'}>
              What areas of Web3 are you most interested in?
            </FormLabel>
            <ReactSelect
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              options={IndustryList}
              required
              onChange={(e: any) => {
                setDropDownValues((st) => {
                  st.interests = JSON.stringify(
                    e.map((elm: { label: string; value: string }) => elm.value)
                  );
                  return { ...st };
                });
              }}
              styles={{
                control: (baseStyles) => ({
                  ...baseStyles,
                  border:
                    DropDownValues.interests.length === 0 && post
                      ? '2px solid red'
                      : baseStyles.border,
                }),
              }}
            />
          </Box>
          <SkillSelect
            errorSkill={post && skills.length === 0}
            errorSubSkill={post && subskills.length === 0}
            skills={skills}
            subSkills={subskills}
            setSkills={setskills}
            setSubSkills={setsubskills}
          />
          <Flex align={'center'} mb={'2.5rem'}>
            <Checkbox
              mr={'0.7rem'}
              colorScheme="green"
              required={false}
              size="md"
            >
              Keep my info private
            </Checkbox>
            <Tooltip
              w="max"
              p="0.7rem"
              color="white"
              fontSize="0.9rem"
              fontWeight={600}
              bg="#6562FF"
              borderRadius="0.5rem"
              hasArrow
              label={`Your "Work Preference" information will be hidden from your public talent profile. However, you will continue to receive updates about new opportunities on your email.`}
              placement="right-end"
            >
              <Image alt={'Info Icon'} src={'/assets/icons/info-icon.svg'} />
            </Tooltip>
          </Flex>
          <Button
            w={'full'}
            h="50px"
            color={'white'}
            bg={'rgb(101, 98, 255)'}
            type="submit"
          >
            Continue
          </Button>
        </FormControl>
      </form>
    </Box>
  );
};

const socials = [
  {
    label: 'Twitter',
    placeHolder: 'https://twitter.com/SuperteamDAO',
    icon: '/assets/talent/twitter.png',
  },
  {
    label: 'GitHub',
    placeHolder: 'https://github.com/superteamDAO',
    icon: '/assets/talent/github.png',
  },
  {
    label: 'LinkedIn',
    placeHolder: 'https://linkedin.com/in/superteamDAO',
    icon: '/assets/talent/link.png',
  },
  {
    label: 'Telegram',
    placeHolder: 'https://t.me/SuperteamDAO',
    icon: '/assets/talent/telegram.png',
  },
  {
    label: 'Site',
    placeHolder: 'https://superteam.fun',
    icon: '/assets/talent/site.png',
  },
];

type TypeSocialInput = {
  label: string;
  placeHolder: string;
  icon: string;
  register: UseFormRegister<FieldValues>;
};

const SocialInput = ({
  label,
  placeHolder,
  icon,
  register,
}: TypeSocialInput) => {
  return (
    <Flex align="center" justify="center" direction="row" mb={'1.25rem'}>
      <Box
        w="30%"
        h="2.6875rem"
        pl={{
          sm: '5px',
          md: '20px',
        }}
        border={'1px solid #E2E8EF'}
        borderRight="none"
      >
        <Flex align="center" justify="start" w={'100%'} h={'100%'}>
          <Box w={'1rem'}>
            <Image
              w={'100%'}
              h={'100%'}
              objectFit="contain"
              alt="Twitter"
              src={icon}
            />
          </Box>
          <Text
            h="4.3rem"
            pl="10px"
            fontSize="0.875rem"
            fontWeight={500}
            lineHeight="4.3rem"
            textAlign="left"
          >
            {label}
          </Text>
        </Flex>
      </Box>
      <Input
        w="70%"
        h="2.6875rem"
        color={'gray.800'}
        fontSize="0.875rem"
        fontWeight={500}
        borderLeftRadius="0"
        _placeholder={{ color: 'gray.500' }}
        focusBorderColor="#CFD2D7"
        placeholder={placeHolder}
        title={label}
        {...register(label)}
      />
    </Flex>
  );
};

function isValidHttpUrl(string: string) {
  if (string.length === 0) {
    return true;
  }
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

const AddProject = ({
  isOpen,
  onClose,
  setpow,
}: {
  isOpen: boolean;
  onClose: () => void;
  pow: string[];
  setpow: Dispatch<SetStateAction<string[]>>;
}) => {
  const { register, handleSubmit } = useForm();
  const [skillsError, setskillsError] = useState<boolean>(false);
  const [linkError, setlinkError] = useState<boolean>(false);

  const [skills, setskills] = useState<MultiSelectOptions[]>([]);
  const [subskills, setsubskills] = useState<MultiSelectOptions[]>([]);

  console.log(skills, subskills);

  const onSubmit = (data: any) => {
    let error = false;

    if (!isValidHttpUrl(data.link)) {
      setlinkError(true);
      error = true;
    } else {
      setlinkError(false);
    }
    if (skills.length === 0 || subskills.length === 0) {
      setskillsError(true);
      error = true;
    } else {
      setskillsError(false);
    }

    if (error) {
      return false;
    }

    setpow((elm) => [
      ...elm,
      JSON.stringify({
        ...data,
        skills: skills.map((ele) => ele.value),
        SubSkills: subskills.map((ele) => ele.value),
      }),
    ]);
    onClose();
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW={'607px'} py={'1.4375rem'}>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl isRequired>
              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'gray.600'}>Project Title</FormLabel>
                <Input
                  color={'gray.800'}
                  _placeholder={{ color: 'gray.500' }}
                  id="title"
                  placeholder="Project Title"
                  {...register('title', { required: true })}
                />
              </Box>
              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'gray.600'}>Describe Your Work</FormLabel>
                <Textarea
                  placeholder="About the Project"
                  {...register('description', { required: true })}
                />
              </Box>
              <SkillSelect
                skills={skills}
                subSkills={subskills}
                setSkills={setskills}
                setSubSkills={setsubskills}
              />

              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'gray.600'}>Link</FormLabel>
                <InputGroup _placeholder={{ color: 'gray.500' }}>
                  <InputLeftElement
                    _placeholder={{ color: 'gray.500' }}
                    pointerEvents="none"
                    // eslint-disable-next-line react/no-children-prop
                    children={<LinkIcon color="gray.300" />}
                  />
                  <Input
                    color={'gray.800'}
                    _placeholder={{ color: 'gray.500' }}
                    placeholder="https://example.com"
                    {...register('link', { required: true })}
                  />
                </InputGroup>
              </Box>
              <Box w={'full'} mb={'1.25rem'}>
                {skillsError && (
                  <Text color={'red'}>Please add Skills and Sub Skills</Text>
                )}
                {linkError && (
                  <Text color={'red'}>
                    Link URL needs to contain &quot;http://&quot; prefix
                  </Text>
                )}
              </Box>
              <Button
                w={'full'}
                h="50px"
                color={'white'}
                bg={'rgb(101, 98, 255)'}
                type="submit"
              >
                Add Project
              </Button>
            </FormControl>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const YourLinks = ({
  success,
}: {
  setStep?: Dispatch<SetStateAction<number>>;
  success: () => void;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { form } = useFormStore();
  const { publicKey } = useWallet();
  const [pow, setpow] = useState<string[]>([]);
  const [socialsError, setsocialsError] = useState<boolean>(false);
  const [urlError, seturlError] = useState<boolean>(false);
  const [isLoading, setisLoading] = useState<boolean>(false);

  const { updateState } = useFormStore();

  const user = userStore().userInfo;

  const uploadProfile = async (
    // eslint-disable-next-line @typescript-eslint/no-shadow
    socials: {
      twitter: string;
      github: string;
      linkedin: string;
      telegram: string;
      website: string;
    },
    // eslint-disable-next-line @typescript-eslint/no-shadow
    pow: string
  ) => {
    // atleast one URL
    if (
      socials.twitter.length === 0 &&
      socials.github.length === 0 &&
      socials.linkedin.length === 0 &&
      socials.telegram.length === 0 &&
      socials.website.length === 0
    ) {
      return setsocialsError(true);
    }
    setsocialsError(false);

    // Valid URL
    if (!isValidHttpUrl(socials.twitter)) {
      return seturlError(true);
    }
    if (!isValidHttpUrl(socials.github)) {
      return seturlError(true);
    }
    if (!isValidHttpUrl(socials.linkedin)) {
      return seturlError(true);
    }
    if (!isValidHttpUrl(socials.telegram)) {
      return seturlError(true);
    }
    if (!isValidHttpUrl(socials.website)) {
      return seturlError(true);
    }

    updateState({ pow, ...socials });
    console.log(form);
    setisLoading(true);
    const createTalent = axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/talent/create`,
      {
        ...form,
        pow,
        ...socials,
        verified: true,
        superteamLevel: 'Lurker',
        id: genrateuuid(),
        publickey: publicKey?.toBase58() as string,
      }
    );
    const updateUser = axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/update`,
      {
        id: user?.id,
        update: {
          talent: true,
        },
      }
    );

    const res = await Promise.all([createTalent, updateUser]);

    console.log(res);
    if (res[0] && res[1]) {
      success();
    }
    return null;
  };

  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
    uploadProfile(
      {
        twitter: data.Twitter,
        github: data.GitHub,
        linkedin: data.LinkedIn,
        telegram: data.Telegram,
        website: data.Site,
      },
      JSON.stringify(pow)
    );
  };
  return (
    <>
      <Box w={'full'}>
        <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
          <FormControl w="full" mb={5}>
            {socials.map((sc, idx: number) => {
              return (
                <SocialInput register={register} {...sc} key={`sc${idx}`} />
              );
            })}
            <Text fontSize={'0.9375rem'} fontWeight={'600'}>
              Other Proof of Work
            </Text>
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
                    color={'gray.600'}
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
                          setpow((elem) => {
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
              mt="2"
              mb={'6'}
              color={'gray.600'}
              fontSize={'12px'}
              leftIcon={<AddIcon color={'gray.600'} />}
              onClick={() => {
                onOpen();
              }}
            >
              Add Project
            </Button>
            {socialsError && (
              <Text mb={'0.5rem'} color={'red'}>
                Please fill at least one social link to continue !
              </Text>
            )}
            {urlError && (
              <Text mb={'0.5rem'} color={'red'}>
                URL needs to contain &quot;http://&quot; prefix
              </Text>
            )}
            <Button
              w={'full'}
              h="50px"
              color={'white'}
              bg={'rgb(101, 98, 255)'}
              isLoading={isLoading}
              spinnerPlacement="start"
              type="submit"
            >
              Finish Profile
            </Button>
          </FormControl>
        </form>
      </Box>
      <AddProject
        key={`${pow.length}project`}
        {...{ isOpen, onClose, pow, setpow }}
      />
    </>
  );
};

const StepsCon = ({ setSuccess }: { setSuccess: () => void }) => {
  const [currentStep, setSteps] = useState<number>(1);
  const stepList = [
    {
      label: 'About You',
      number: 1,
    },
    {
      label: 'Your Work',
      number: 2,
    },
    {
      label: 'Links',
      number: 3,
    },
  ];

  const TitleArray = [
    {
      title: 'Create Your Profile',
      subTitle:
        " If you're ready to start contributing to Solana, you're in the right place.",
    },
    {
      title: 'Tell Us About Your Work',
      subTitle: 'The more you tell us, the better we can match you',
    },
    {
      title: 'Socials & Proof of Work',
      subTitle: 'Where can people learn more about your work?',
    },
  ];

  return (
    <VStack gap={10} w={'xl'}>
      <VStack mt={20}>
        <Heading
          color={'#334254'}
          fontFamily={'Inter'}
          fontSize={'24px'}
          fontWeight={700}
        >
          {TitleArray[currentStep - 1]?.title}
        </Heading>
        <Text
          color={'#94A3B8'}
          fontFamily={'Inter'}
          fontSize={'20px'}
          fontWeight={500}
          textAlign={'center'}
        >
          {TitleArray[currentStep - 1]?.subTitle}
        </Text>
      </VStack>
      <HStack w="100%" pb={'2rem'}>
        {stepList.map((step) => {
          return (
            <>
              <Steps
                setStep={setSteps}
                currentStep={currentStep}
                label={step.label}
                thisStep={step.number}
              />
              {step.number !== stepList.length && (
                <>
                  <hr
                    style={{
                      width: '50%',
                      outline:
                        currentStep >= step.number
                          ? '1px solid #6562FF'
                          : '1px solid #CBD5E1',
                      border: 'none',
                    }}
                  />
                  {step.number === currentStep && (
                    <hr
                      style={{
                        width: '50%',
                        outline: '1px solid #CBD5E1',
                        border: 'none',
                      }}
                    />
                  )}
                </>
              )}
            </>
          );
        })}
      </HStack>
      {currentStep === 1 && <AboutYou setStep={setSteps} />}
      {currentStep === 2 && <YourWork setStep={setSteps} />}
      {currentStep === 3 && (
        <YourLinks
          setStep={setSteps}
          success={() => {
            setSuccess();
          }}
        />
      )}
    </VStack>
  );
};

const WelcomeMessage = ({ setStep }: { setStep: () => void }) => {
  return (
    <Box w={'xl'} minH={'100vh'}>
      <VStack mt={20} pt={'93px'}>
        <Heading
          color={'#334254'}
          fontFamily={'Inter'}
          fontSize={'1.5rem'}
          fontWeight={700}
        >
          Welcome to Superteam Earn
        </Heading>
        <Text
          color={'gray.400'}
          fontFamily={'Inter'}
          fontSize={'1.25rem'}
          fontWeight={500}
          textAlign={'center'}
        >
          A message from Kash
        </Text>
      </VStack>
      <Flex w={'34.375rem'} h={'16.9375rem'} mt={'46px'} borderRadius={'7px'}>
        <Image
          w={'100%'}
          h={'100%'}
          alt=""
          src={'/assets/bg/vid-placeholder.png'}
        />
      </Flex>
      <Button
        w={'34.375rem'}
        h="50px"
        mt={'1.8125rem'}
        color={'white'}
        bg={'rgb(101, 98, 255)'}
        onClick={() => setStep()}
      >
        Continue
      </Button>
    </Box>
  );
};

const VerifyEmail = ({ setStep }: { setStep: () => void }) => {
  const [email, setemail] = useState('');
  const [otp, setOtp] = useState<
    { current: number; last: number } | undefined
  >();
  console.log('file: talent.tsx:1159 ~ VerifyEmail ~ otp:', otp);

  const setOtpStore = useFormStore().setOtp;
  const { updateState } = useFormStore();
  const { publicKey } = useWallet();

  const otpSend = async () => {
    updateState({ email });
    await generateOtp(publicKey?.toBase58() as string, email);

    const code = generateCode(publicKey?.toBase58() as string);
    const codeLast = generateCodeLast(publicKey?.toBase58() as string);
    setOtp({
      current: code,
      last: codeLast,
    });
    setOtpStore(code);
    setStep();
  };

  return (
    <Box w={'xl'} minH={'100vh'}>
      <VStack mt={20} pt={'93px'}>
        <Heading
          color={'#334254'}
          fontFamily={'Inter'}
          fontSize={'1.5rem'}
          fontWeight={700}
        >
          Verify your email
        </Heading>
        <Text
          color={'gray.400'}
          fontFamily={'Inter'}
          fontSize={'1.25rem'}
          fontWeight={500}
          textAlign={'center'}
        >
          We need to verify your email
        </Text>
      </VStack>
      <Center
        w={'11.625rem'}
        h={'11.625rem'}
        mt={'7.625rem'}
        mx={'auto'}
        bg={'gray.50'}
        borderRadius={'full'}
      >
        <Image alt="" src="/assets/icons/mail.svg" />
      </Center>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          otpSend();
        }}
      >
        <Box mt={'4.6875rem'}>
          <FormLabel color={'gray.600'}>Your Email</FormLabel>
          <Input
            w={'34.375rem'}
            color={'gray.800'}
            _placeholder={{ color: 'gray.500' }}
            onChange={(e) => {
              setemail(e.target.value);
            }}
            placeholder="john.doe@gmail.com"
            required
            type={'email'}
            value={email}
          />
        </Box>
        <Button
          w={'34.375rem'}
          h="50px"
          mt={'1.8125rem'}
          color={'white'}
          bg={'rgb(101, 98, 255)'}
          type="submit"
        >
          Send Verification
        </Button>
      </form>
    </Box>
  );
};

const OtpScreen = ({ setStep }: { setStep: () => void }) => {
  const { otp, verifyEmail } = useFormStore();
  const { publicKey } = useWallet();
  const { email } = useFormStore().form;

  const [invalidOtp, setinvalidOtp] = useState(false);

  const setOtpStore = useFormStore().setOtp;
  const { updateState } = useFormStore();

  const otpSend = async () => {
    updateState({ email });
    const a = await generateOtp(publicKey?.toBase58() as string, email);
    console.log(a);

    const code = generateCode(publicKey?.toBase58() as string);
    setOtpStore(code);
  };

  return (
    <Box w={'xl'} minH={'100vh'}>
      <VStack mt={20} pt={'93px'}>
        <Heading
          color={'#334254'}
          fontFamily={'Inter'}
          fontSize={'1.5rem'}
          fontWeight={700}
        >
          Enter the OTP Sent to you
        </Heading>
        <Text
          color={'gray.400'}
          fontFamily={'Inter'}
          fontSize={'1.25rem'}
          fontWeight={500}
          textAlign={'center'}
        >
          We sent you an OTP on {email}
        </Text>
      </VStack>
      <Flex justify={'center'} columnGap={'25px'} mt={'10.375rem'} mx={'auto'}>
        <PinInput
          isInvalid={invalidOtp}
          onComplete={(e) => {
            if (`${otp}` === e) {
              verifyEmail();
              setStep();
            } else {
              setinvalidOtp(true);
            }
          }}
        >
          <PinInputField
            w={'3.8094rem'}
            fontSize={'24px'}
            textAlign={'center'}
            border={'none'}
            borderBottom={'1.5px solid #939BAE'}
            borderRadius={'0'}
            _focusVisible={{
              outline: 'none',
              borderColor: '#627BFF',
              borderWidth: '2.5px',
            }}
          />
          <PinInputField
            w={'3.8094rem'}
            fontSize={'24px'}
            textAlign={'center'}
            border={'none'}
            borderBottom={'1.5px solid #939BAE'}
            borderRadius={'0'}
            _focusVisible={{
              outline: 'none',
              borderColor: '#627BFF',
              borderWidth: '2.5px',
            }}
          />
          <PinInputField
            w={'3.8094rem'}
            fontSize={'24px'}
            textAlign={'center'}
            border={'none'}
            borderBottom={'1.5px solid #939BAE'}
            borderRadius={'0'}
            _focusVisible={{
              outline: 'none',
              borderColor: '#627BFF',
              borderWidth: '2.5px',
            }}
          />
          <PinInputField
            w={'3.8094rem'}
            fontSize={'24px'}
            textAlign={'center'}
            border={'none'}
            borderBottom={'1.5px solid #939BAE'}
            borderRadius={'0'}
            _focusVisible={{
              outline: 'none',
              borderColor: '#627BFF',
              borderWidth: '2.5px',
            }}
          />
          <PinInputField
            w={'3.8094rem'}
            fontSize={'24px'}
            textAlign={'center'}
            border={'none'}
            borderBottom={'1.5px solid #939BAE'}
            borderRadius={'0'}
            _focusVisible={{
              outline: 'none',
              borderColor: '#627BFF',
              borderWidth: '2.5px',
            }}
          />
          <PinInputField
            w={'3.8094rem'}
            fontSize={'24px'}
            textAlign={'center'}
            border={'none'}
            borderBottom={'1.5px solid #939BAE'}
            borderRadius={'0'}
            _focusVisible={{
              outline: 'none',
              borderColor: '#627BFF',
              borderWidth: '2.5px',
            }}
          />
        </PinInput>
      </Flex>
      <Flex justify="space-between" mt={'130px'}>
        <Text color={'gray.600'} fontSize={'1rem'} fontWeight={'500'}></Text>
        <Text
          color={'#6562FF'}
          fontSize={'1rem'}
          fontWeight={'500'}
          _hover={{ opacity: 0.5 }}
          cursor={'pointer'}
          onClick={() => {
            otpSend();
          }}
        >
          RESEND
        </Text>
      </Flex>
    </Box>
  );
};

const SuccessScreen = () => {
  const { form } = useFormStore();

  if (!form) {
    return (
      <Center w={'100%'} h={'100vh'} pt={'3rem'}>
        <Spinner
          color="blue.500"
          emptyColor="gray.200"
          size="xl"
          speed="0.65s"
          thickness="4px"
        />
      </Center>
    );
  }
  console.log(form);

  return (
    <Box
      w={'100%'}
      h={'100%'}
      minH={'100vh'}
      pt={'6.25rem'}
      bgImage="url('/assets/bg/success-bg.png')"
      bgSize={'cover'}
      bgRepeat={'no-repeat'}
    >
      <VStack>
        <Image w={'40px'} h={'40px'} alt={''} src="/assets/icons/success.png" />
        <Text color={'white'} fontSize={'1.8125rem'} fontWeight={'700'}>
          Your Earn Profile is Ready!
        </Text>
        <Text
          color={'rgba(255, 255, 255, 0.53)'}
          fontSize={'29px'}
          fontWeight={'500'}
        >
          Have a look at your profile or start earning
        </Text>
      </VStack>
      <HStack gap={'1.25rem'} w={'fit-content'} mt={'66px'} mx={'auto'}>
        <TalentBio data={form} successPage={true} />
        <Flex
          align={'center'}
          direction={'column'}
          w={'34.375rem'}
          h={'21.375rem'}
          pt={'33px'}
          bg={'white'}
          borderRadius={'0.6875rem'}
        >
          <Center w={'30.6875rem'} h={'206px'} mx={'auto'} bg={'#E0F2FF'}>
            <Image
              w={'26.875rem'}
              h={'12.875rem'}
              alt={''}
              src="/assets/talent/fake-tasks.png"
            />
          </Center>
          <Button
            w={'31.0625rem'}
            h="50px"
            mt={'1.8125rem'}
            color={'white'}
            bg={'rgb(101, 98, 255)'}
            onClick={() => {
              window.location.href = window.location.origin;
            }}
          >
            Start Earning
          </Button>
        </Flex>
      </HStack>
    </Box>
  );
};

function Talent() {
  const [currentPage, setcurrentPage] = useState('welcome');
  const { connected } = useWallet();

  if (!connected) {
    return <ConnectWallet />;
  }

  return (
    <VStack>
      <Navbar />
      {currentPage === 'welcome' && (
        <WelcomeMessage
          setStep={() => {
            setcurrentPage('email');
          }}
        />
      )}
      {currentPage === 'email' && (
        <VerifyEmail
          setStep={() => {
            setcurrentPage('otp');
          }}
        />
      )}
      {currentPage === 'otp' && (
        <OtpScreen
          setStep={() => {
            setcurrentPage('steps');
          }}
        />
      )}
      {currentPage === 'steps' && (
        <StepsCon
          setSuccess={() => {
            setcurrentPage('success');
          }}
        />
      )}
      {currentPage === 'success' && <SuccessScreen />}
    </VStack>
  );
}

export default Talent;
