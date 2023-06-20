import { AddIcon, DeleteIcon, LinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import type { FieldValues, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import type { MultiSelectOptions } from '@/constants';
import { userStore } from '@/store/user';
import { isValidHttpUrl } from '@/utils/validUrl';

import { SkillSelect } from '../misc/SkillSelect';
import type { UserStoreType } from './types';

const socials = [
  {
    label: 'Discord',
    placeHolder: 'TonyStark#7589',
    icon: '/assets/talent/discord.png',
  },
  {
    label: 'Twitter',
    placeHolder: 'https://twitter.com/TonyStark',
    icon: '/assets/talent/twitter.png',
  },
  {
    label: 'GitHub',
    placeHolder: 'https://github.com/tonystark',
    icon: '/assets/talent/github.png',
  },
  {
    label: 'LinkedIn',
    placeHolder: 'https://linkedin.com/in/tony-stark',
    icon: '/assets/talent/link.png',
  },
  {
    label: 'Telegram',
    placeHolder: 'https://t.me/tonystark',
    icon: '/assets/talent/telegram.png',
  },
  {
    label: 'Site',
    placeHolder: 'https://starkindustries.com',
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
        border="1px solid"
        borderColor={'brand.slate.300'}
        borderRight="none"
        borderLeftRadius={'md'}
      >
        <Flex align="center" justify="start" w={'100%'} h={'100%'}>
          <Box w={'1rem'}>
            <Image
              w={'100%'}
              h={'100%'}
              objectFit="contain"
              alt={label}
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
            {label === 'Discord' && (
              <Text as="sup" ml={1} color="red">
                *
              </Text>
            )}
          </Text>
        </Flex>
      </Box>
      <Input
        w="70%"
        h="2.6875rem"
        color={'gray.800'}
        fontSize="0.875rem"
        fontWeight={500}
        borderColor={'brand.slate.300'}
        borderLeftRadius="0"
        _placeholder={{
          color: 'brand.slate.300',
        }}
        focusBorderColor="brand.purple"
        placeholder={placeHolder}
        title={label}
        {...register(label)}
      />
    </Flex>
  );
};

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
  const [skillsError, setSkillsError] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<boolean>(false);

  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);

  const onSubmit = (data: any) => {
    let error = false;

    if (!isValidHttpUrl(data.link)) {
      setLinkError(true);
      error = true;
    } else {
      setLinkError(false);
    }
    if (skills.length === 0 || subSkills.length === 0) {
      setSkillsError(true);
      error = true;
    } else {
      setSkillsError(false);
    }

    if (error) {
      return false;
    }

    setpow((elm) => [
      ...elm,
      JSON.stringify({
        ...data,
        skills: skills.map((ele) => ele.value),
        subSkills: subSkills.map((ele) => ele.value),
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
                <FormLabel color={'brand.slate.500'}>Project Title</FormLabel>
                <Input
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  focusBorderColor="brand.purple"
                  id="title"
                  placeholder="Project Title"
                  {...register('title', { required: true })}
                />
              </Box>
              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'brand.slate.500'}>
                  Describe Your Work
                </FormLabel>
                <Textarea
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  focusBorderColor="brand.purple"
                  placeholder="About the Project"
                  {...register('description', { required: true })}
                />
              </Box>
              <SkillSelect
                skills={skills}
                subSkills={subSkills}
                setSkills={setSkills}
                setSubSkills={setSubSkills}
              />

              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'brand.slate.500'}>Link</FormLabel>
                <InputGroup _placeholder={{ color: 'gray.500' }}>
                  <InputLeftElement
                    _placeholder={{ color: 'gray.500' }}
                    pointerEvents="none"
                    // eslint-disable-next-line react/no-children-prop
                    children={<LinkIcon color="gray.300" />}
                  />
                  <Input
                    borderColor="brand.slate.300"
                    _placeholder={{
                      color: 'brand.slate.300',
                    }}
                    focusBorderColor="brand.purple"
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

interface Props {
  setStep?: Dispatch<SetStateAction<number>>;
  success: () => void;
  useFormStore: () => UserStoreType;
}

function YourLinks({ success, useFormStore }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { form } = useFormStore();
  const [pow, setpow] = useState<string[]>([]);
  const [socialsError, setsocialsError] = useState<boolean>(false);
  const [urlError, seturlError] = useState<boolean>(false);
  const [isLoading, setisLoading] = useState<boolean>(false);

  const { updateState } = useFormStore();

  const { setUserInfo, userInfo } = userStore();

  const uploadProfile = async (
    // eslint-disable-next-line @typescript-eslint/no-shadow
    socials: {
      discord: string;
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
      setsocialsError(true);
      return;
    }
    setsocialsError(false);

    // Valid URL
    if (!isValidHttpUrl(socials.twitter)) {
      seturlError(true);
      return;
    }
    if (!isValidHttpUrl(socials.github)) {
      seturlError(true);
      return;
    }
    if (!isValidHttpUrl(socials.linkedin)) {
      seturlError(true);
      return;
    }
    if (!isValidHttpUrl(socials.telegram)) {
      seturlError(true);
      return;
    }
    if (!isValidHttpUrl(socials.website)) {
      seturlError(true);
      return;
    }

    updateState({ pow, ...socials });
    setisLoading(true);
    try {
      const updateOptions = {
        id: userInfo?.id,
        ...form,
        pow,
        ...socials,
        superteamLevel: 'Lurker',
        isTalentFilled: true,
      };
      // eslint-disable-next-line unused-imports/no-unused-vars
      const { subSkills, ...finalOptions } = updateOptions;
      const updatedUser = await axios.post('/api/user/update/', finalOptions);
      await axios.post('/api/email/manual/welcomeTalent/', {
        email: userInfo?.email,
        name: userInfo?.firstName,
      });
      setUserInfo(updatedUser?.data);
      success();
    } catch (e) {
      setisLoading(false);
    }
  };

  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    uploadProfile(
      {
        discord: data.Discord,
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
            <Text color={'brand.slate.500'} fontWeight={'500'}>
              Other Proof of Work
            </Text>
            <Text mb={3} color={'brand.slate.400'} fontWeight={400}>
              Adding more PoW increases your chance of getting work
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
              mb={8}
              leftIcon={<AddIcon />}
              onClick={() => {
                onOpen();
              }}
              variant="outline"
            >
              Add Project
            </Button>
            {socialsError && (
              <Text align="center" mb={'0.5rem'} color={'red'}>
                Please fill at least one social link to continue!
              </Text>
            )}

            {urlError && (
              <Text align="center" mb={'0.5rem'} color={'red'}>
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
}

export default YourLinks;
