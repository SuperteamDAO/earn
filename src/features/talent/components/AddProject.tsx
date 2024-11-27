import { LinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  Textarea,
} from '@chakra-ui/react';
import axios from 'axios';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { SkillSelect } from '@/components/shared/SkillSelect';
import type { MultiSelectOptions } from '@/constants';
import { type FeedDataProps } from '@/features/feed';
import type { PoW } from '@/interface/pow';
import { useUser } from '@/store/user';

type AddProjectProps = {
  isOpen: boolean;
  onClose: () => void;
  pow?: PoW[];
  setPow?: Dispatch<SetStateAction<PoW[]>>;
  selectedProject?: number | null;
  setSelectedProject?: (selectedProject: number | null) => void;
  upload?: boolean;
  onNewPow?: (newPow: PoW) => void;
};

export const AddProject = ({
  isOpen,
  onClose,
  pow,
  setPow,
  selectedProject,
  setSelectedProject,
  upload,
  onNewPow,
}: AddProjectProps) => {
  const { register, handleSubmit, setValue, watch } = useForm<{
    title: string;
    description: string;
    link: string;
    skills: MultiSelectOptions[];
    subSkills: MultiSelectOptions[];
  }>();

  const [skillsError, setSkillsError] = useState<boolean>(false);
  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);

  const { user } = useUser();

  const projectToEdit =
    selectedProject !== null && pow ? pow[selectedProject as number] : null;

  useEffect(() => {
    if (!isOpen) {
      setValue('title', '');
      setValue('description', '');
      setValue('link', '');
      setSkills([]);
      setSubSkills([]);
      if (setSelectedProject) {
        setSelectedProject(null);
      }
    } else if (projectToEdit && setSelectedProject) {
      setValue('title', projectToEdit.title);
      setValue('description', projectToEdit.description);
      setValue('link', projectToEdit.link);
      setSkills(
        projectToEdit.skills.map((value: string) => ({ label: value, value })),
      );
      setSubSkills(
        projectToEdit.subSkills.map((value: string) => ({
          label: value,
          value,
        })),
      );
    }
  }, [isOpen, projectToEdit, setValue, setSelectedProject]);

  const onSubmit = async (data: any): Promise<void> => {
    let error = false;

    if (skills.length === 0 || subSkills.length === 0) {
      setSkillsError(true);
      error = true;
    } else {
      setSkillsError(false);
    }

    if (error) {
      return;
    }

    const projectData: PoW & Partial<FeedDataProps> = {
      title: data.title,
      description: data.description,
      link: data.link,
      skills: skills.map((ele) => ele.value),
      subSkills: subSkills.map((ele) => ele.value),
      firstName: user?.firstName,
      lastName: user?.lastName,
      photo: user?.photo,
      createdAt: new Date().toISOString(),
    };

    if (upload) {
      try {
        await axios.post('/api/pow/create', {
          pows: [
            {
              title: projectData.title,
              description: projectData.description,
              link: projectData.link,
              skills: projectData.skills,
              subSkills: projectData.subSkills,
            },
          ],
        });
        if (onNewPow) {
          onNewPow(projectData);
        }
      } catch (e) {
        console.error('Error posting to DB:', e);
        return;
      }
    } else if (setPow && setSelectedProject !== undefined) {
      if (selectedProject !== null) {
        setPow((prevPow) => {
          const updatedPow = [...prevPow!];
          updatedPow[selectedProject as number] = {
            ...updatedPow[selectedProject as number],
            ...projectData,
          };
          return updatedPow;
        });
        setSelectedProject(null);
      } else {
        setPow((prevPow) => [...prevPow!, projectData]);
      }
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW={'607px'} py={'1.4375rem'}>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl isRequired>
              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'brand.slate.500'}>项目名称</FormLabel>
                <Input
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  focusBorderColor="brand.purple"
                  id="title"
                  placeholder=""
                  {...register('title', { required: true })}
                />
              </Box>
              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'brand.slate.500'}>描述你的工作</FormLabel>
                <Textarea
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  focusBorderColor="brand.purple"
                  id={'description'}
                  maxLength={180}
                  placeholder=""
                  {...register('description', { required: true })}
                />
                <Text
                  color={
                    (watch('description')?.length || 0) > 160
                      ? 'red'
                      : 'brand.slate.400'
                  }
                  fontSize={'xs'}
                  textAlign="right"
                >
                  还剩 {180 - (watch('description')?.length || 0)}
                </Text>
              </Box>
              <SkillSelect
                skills={skills}
                subSkills={subSkills}
                setSkills={setSkills}
                setSubSkills={setSubSkills}
                skillLabel="主技能"
                subSkillLabel="子技能"
              />

              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'brand.slate.500'}>项目链接</FormLabel>
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
                    placeholder=""
                    {...register('link', { required: true })}
                  />
                </InputGroup>
              </Box>
              <Box w={'full'} mb={'1.25rem'}>
                {skillsError && <Text color={'red'}>请添加技能与子技能</Text>}
              </Box>
              <Button
                w={'full'}
                h="50px"
                color={'white'}
                bg={'rgb(101, 98, 255)'}
                type="submit"
              >
                添加项目
              </Button>
            </FormControl>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
