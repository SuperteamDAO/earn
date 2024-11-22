import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Box, Button, Center, Flex, FormControl, Text } from '@chakra-ui/react';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useDisclosure } from '@/hooks/use-disclosure';
import type { PoW } from '@/interface/pow';
import { useUser } from '@/store/user';

import { AddProject } from '../AddProject';
import { SocialInput } from '../SocialInput';
import type { UserStoreType } from './types';

interface Props {
  setStep?: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
}

export function YourLinks({ useFormStore }: Props) {
  const { refetchUser } = useUser();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { form } = useFormStore();
  const [pow, setPow] = useState<PoW[]>([]);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { updateState } = useFormStore();

  const posthog = usePostHog();

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
    updateState({ ...socials });
    setisLoading(true);
    try {
      await axios.post('/api/pow/create', {
        pows: pow,
      });

      const updateOptions = {
        ...form,
        ...socials,
      };
      // eslint-disable-next-line unused-imports/no-unused-vars
      const { subSkills, ...finalOptions } = updateOptions;

      await axios.post('/api/user/complete-profile/', finalOptions);
      await axios.post('/api/email/manual/welcome-talent/');
      await refetchUser();
    } catch (e) {
      setisLoading(false);
    }
  };

  const { register, handleSubmit, watch } = useForm();

  const onSubmit = (data: any) => {
    const socialFields = [
      'twitter',
      'github',
      'linkedin',
      'website',
      'telegram',
    ];
    const filledSocials = socialFields.filter((field) => data[field]);

    if (filledSocials.length === 0) {
      toast.error(
        'At least one additional social link (apart from Discord) is required',
      );
      return;
    }

    posthog.capture('finish profile_talent');
    uploadProfile(
      {
        discord: data.discord,
        twitter: data.twitter,
        github: data.github,
        linkedin: data.linkedin,
        telegram: data.telegram,
        website: data.website,
      },
      pow,
    );
  };
  return (
    <>
      <Box w={'full'} mb={'4rem'}>
        <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
          <FormControl w="full" mb={5}>
            <SocialInput watch={watch} register={register} />
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

            <Button
              className="ph-no-capture"
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
