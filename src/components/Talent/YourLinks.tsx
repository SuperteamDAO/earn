import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  Image,
  Input,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import { type Dispatch, type SetStateAction, useState } from 'react';
import {
  type FieldValues,
  useForm,
  type UseFormRegister,
} from 'react-hook-form';

import type { PoW } from '@/interface/pow';
import { userStore } from '@/store/user';

import { AddProject } from '../Form/AddProject';
import type { UserStoreType } from './types';

export const socials = [
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
    icon: '/assets/talent/linkedin.png',
  },
  {
    label: 'Telegram',
    placeHolder: 'https://t.me/tonystark',
    icon: '/assets/talent/telegram.png',
  },
  {
    label: 'Website',
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
        <Flex
          align="center"
          justify={{ base: 'center', md: 'start' }}
          w={'100%'}
          h={'100%'}
        >
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
            fontSize={{ base: '0.7rem', md: '0.875rem' }}
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

interface Props {
  setStep?: Dispatch<SetStateAction<number>>;
  success: () => void;
  useFormStore: () => UserStoreType;
}

export function YourLinks({ success, useFormStore }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { form } = useFormStore();
  const [pow, setPow] = useState<PoW[]>([]);
  const [socialsError, setsocialsError] = useState<number>(0);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { updateState } = useFormStore();

  const { setUserInfo } = userStore();

  const uploadProfile = async (
    socials: {
      discord: string;
      twitter: string;
      github: string;
      linkedin: string;
      telegram: string;
      website: string;
    },
    pow: PoW[],
  ) => {
    if (socials.discord.length === 0) {
      setsocialsError(2);
      return;
    }
    // atleast one URL
    if (
      socials.twitter.length === 0 &&
      socials.github.length === 0 &&
      socials.linkedin.length === 0 &&
      socials.telegram.length === 0 &&
      socials.website.length === 0
    ) {
      setsocialsError(1);
      return;
    }
    setsocialsError(0);

    updateState({ ...socials });
    setisLoading(true);
    try {
      await axios.post('/api/pow/create', {
        pows: pow,
      });

      const updateOptions = {
        ...form,
        ...socials,
        superteamLevel: 'Lurker',
        isTalentFilled: true,
        generateTalentEmailSettings: true,
      };
      // eslint-disable-next-line unused-imports/no-unused-vars
      const { subSkills, ...finalOptions } = updateOptions;

      const updatedUser = await axios.post('/api/user/update/', finalOptions);
      await axios.post('/api/email/manual/welcomeTalent/');
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
        website: data.Website,
      },
      pow,
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
              {pow.map((data, idx) => (
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
              ))}
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
            {socialsError === 1 && (
              <Text align="center" mb={'0.5rem'} color={'red'}>
                Please fill at least one social (apart from Discord) to
                continue!
              </Text>
            )}
            {socialsError === 2 && (
              <Text align="center" mb={'0.5rem'} color={'red'}>
                Please fill the discord field!
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
