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
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { MultiSelectOptions } from '@/constants';
import { isValidHttpUrl } from '@/utils/validUrl';

import { SkillSelect } from '../misc/SkillSelect';

type AddProjectProps = {
  isOpen: boolean;
  onClose: () => void;
  pow: any[];
  setPow: Dispatch<SetStateAction<string[]>>;
  selectedProject: number | null;
  setSelectedProject: (selectedProject: number | null) => void;
};

export const AddProject = ({
  isOpen,
  onClose,
  pow,
  setPow,
  selectedProject,
  setSelectedProject,
}: AddProjectProps) => {
  const { register, handleSubmit, setValue } = useForm<{
    title: string;
    description: string;
    link: string;
    skills: MultiSelectOptions[];
    subSkills: MultiSelectOptions[];
  }>();

  const [skillsError, setSkillsError] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<boolean>(false);

  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);

  const projectToEdit = selectedProject !== null ? pow[selectedProject] : null;

  useEffect(() => {
    if (projectToEdit) {
      const parsedProject = JSON.parse(projectToEdit);
      setValue('title', parsedProject.title);
      setValue('description', parsedProject.description);
      setValue('link', parsedProject.link);
      if (parsedProject.skills) {
        setSkills(
          parsedProject.skills.map((value: string) => ({ label: value, value }))
        );
      } else {
        setSkills([]);
      }
      if (parsedProject.subSkills) {
        setSubSkills(
          parsedProject.subSkills.map((value: string) => ({
            label: value,
            value,
          }))
        );
      } else {
        setSubSkills([]);
      }
    }
  }, [projectToEdit, setValue]);

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

    const projectData = JSON.stringify({
      ...data,
      skills: skills.map((ele) => ele.value),
      subSkills: subSkills.map((ele) => ele.value),
    });

    if (selectedProject !== null) {
      setPow((prevPow) => {
        const updatedPow = [...prevPow];
        updatedPow[selectedProject] = projectData;
        return updatedPow;
      });
      setSelectedProject(null);
    } else {
      setPow((prevPow) => [...prevPow, projectData]);
    }

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
