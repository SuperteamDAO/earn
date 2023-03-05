import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';
import { MainSkills, MultiSelectOptions, SubSkills } from '../../../constants';
import { JobBasicsType } from '../../../interface/listings';
import { JobType } from '../../../interface/types';
import { SkillSelect } from '../../misc/SkillSelect';

interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  skills: MultiSelectOptions[];
  jobBasics: JobBasicsType | undefined;
  setJobBasic: Dispatch<SetStateAction<JobBasicsType | undefined>>;
  createDraft: (payment: string) => void;
}
interface ErrorsBasic {
  deadline: boolean;
  link: boolean;
  title: boolean;
  type: boolean;
  subSkills: boolean;
  skills: boolean;
}
export const CreateJobBasic = ({
  setSkills,
  setSteps,
  setSubSkills,
  skills,
  subSkills,
  jobBasics,
  setJobBasic,
  createDraft,
}: Props) => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();
  //
  const [errorState, setErrorState] = useState<ErrorsBasic>({
    deadline: false,
    title: false,
    subSkills: false,
    skills: false,
    link: false,
    type: false,
  });

  const animatedComponents = makeAnimated();
  return (
    <>
      <VStack py={7} align={'start'} w={'2xl'}>
        <FormControl w="full" isRequired isInvalid={errorState.title}>
          <Flex>
            <FormLabel
              color={'gray.400'}
              fontWeight={600}
              fontSize={'15px'}
              htmlFor={'title'}
            >
              Opportunity Title
            </FormLabel>
            <Tooltip
              placement="right-end"
              fontSize="0.9rem"
              padding="0.7rem"
              bg="#6562FF"
              color="white"
              fontWeight={600}
              borderRadius="0.5rem"
              hasArrow
              w="max"
              label={`Who will respond to questions about the opportunity from your team?`}
            >
              <Image
                mt={-2}
                src={'/assets/icons/info-icon.svg'}
                alt={'Info Icon'}
              />
            </Tooltip>
          </Flex>

          <Input
            id="title"
            placeholder="Develop a new landing page"
            value={jobBasics?.title}
            onChange={(e) => {
              setJobBasic({
                ...(jobBasics as JobBasicsType),
                title: e.target.value,
              });
            }}
          />
          <FormErrorMessage>
            {errors.title ? <>{errors.title.message}</> : <></>}
          </FormErrorMessage>
        </FormControl>
        <FormControl my={5} isRequired isInvalid={errorState.type}>
          <Flex>
            <FormLabel
              color={'gray.400'}
              fontWeight={600}
              fontSize={'15px'}
              htmlFor={'title'}
            >
              Job Type
            </FormLabel>
            <Tooltip
              placement="right-end"
              fontSize="0.9rem"
              padding="0.7rem"
              bg="#6562FF"
              color="white"
              fontWeight={600}
              borderRadius="0.5rem"
              hasArrow
              w="max"
              label={`Who will respond to questions about the opportunity from your team?`}
            >
              <Image
                mt={-2}
                src={'/assets/icons/info-icon.svg'}
                alt={'Info Icon'}
              />
            </Tooltip>
          </Flex>
          <Select
            value={jobBasics?.type}
            onChange={(e) => {
              setJobBasic({
                ...(jobBasics as JobBasicsType),
                type: e.target.value as JobType,
              });
            }}
          >
            <option value="fulltime">Full Time</option>
            <option value="internship">Intership</option>
            <option value="parttime">Part Time</option>
          </Select>
          <FormControl my={5} isRequired isInvalid={errorState.link}>
            <Flex>
              <FormLabel
                color={'gray.400'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'application_link'}
              >
                Application Link
              </FormLabel>
              <Tooltip
                placement="right-end"
                fontSize="0.9rem"
                padding="0.7rem"
                bg="#6562FF"
                color="white"
                fontWeight={600}
                borderRadius="0.5rem"
                hasArrow
                w="max"
                label={`Who will respond to questions about the opportunity from your team?`}
              >
                <Image
                  mt={-2}
                  src={'/assets/icons/info-icon.svg'}
                  alt={'Info Icon'}
                />
              </Tooltip>
            </Flex>

            <InputGroup>
              <InputLeftElement
                pointerEvents="none"
                h="100%"
                marginLeft="0.5rem"
                // eslint-disable-next-line react/no-children-prop
                children={
                  <Flex w="2rem" h="2rem" align="center" justify="center">
                    <Image
                      src={'/assets/icons/gray-link.svg'}
                      alt="Link Icon"
                    />
                  </Flex>
                }
              />
              <Input
                padding="0 4rem"
                fontSize="1rem"
                focusBorderColor="#CFD2D7"
                fontWeight={500}
                value={jobBasics?.link}
                placeholder="Where are you collecting applications for this work"
                onChange={(e) => {
                  setJobBasic({
                    ...(jobBasics as JobBasicsType),
                    link: e.target.value,
                  });
                }}
              />
            </InputGroup>
          </FormControl>
        </FormControl>
        <SkillSelect
          errorSkill={errorState.skills}
          errorSubSkill={errorState.subSkills}
          setSkills={setSkills}
          setSubSkills={setSubSkills}
          skills={skills}
          subSkills={subSkills}
        />
        <FormControl isRequired isInvalid={errorState.deadline}>
          <Flex align={'center'} justify={'start'}>
            <FormLabel
              color={'gray.400'}
              fontWeight={600}
              fontSize={'15px'}
              htmlFor={'deadline'}
            >
              Deadline
            </FormLabel>
            <Tooltip
              placement="right-end"
              fontSize="0.9rem"
              padding="0.7rem"
              bg="#6562FF"
              color="white"
              fontWeight={600}
              borderRadius="0.5rem"
              hasArrow
              w="max"
              label={`Who will respond to questions about the opportunity from your team?`}
            >
              <Image
                mt={-2}
                src={'/assets/icons/info-icon.svg'}
                alt={'Info Icon'}
              />
            </Tooltip>
          </Flex>
          <Input
            w={'full'}
            id="deadline"
            type={'date'}
            placeholder="deadline"
            color={'gray.500'}
            value={jobBasics?.deadline}
            onChange={(e) => {
              setJobBasic({
                ...(jobBasics as JobBasicsType),
                deadline: e.target.value,
              });
            }}
          />
          <FormErrorMessage>
            {errors.deadline ? <>{errors.deadline.message}</> : <></>}
          </FormErrorMessage>
        </FormControl>
        <VStack gap={6} w={'full'} pt={10}>
          <Button
            w="100%"
            bg={'#6562FF'}
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            _hover={{ bg: '#6562FF' }}
            onClick={() => {
              setErrorState({
                deadline: jobBasics?.deadline ? false : true,
                skills: skills.length !== 0 ? false : true,
                subSkills: subSkills.length !== 0 ? false : true,
                title: jobBasics?.title ? false : true,
                link: jobBasics?.link ? false : true,
                type: jobBasics?.type ? false : true,
              });

              if (
                jobBasics?.deadline &&
                jobBasics?.title &&
                jobBasics?.link &&
                jobBasics?.type &&
                skills.length !== 0 &&
                subSkills.length !== 0
              ) {
                setSteps(3);
              }
            }}
          >
            Continue
          </Button>
          <Button
            w="100%"
            fontSize="1rem"
            fontWeight={600}
            color="gray.500"
            border="1px solid"
            borderColor="gray.200"
            bg="transparent"
            onClick={() => {
              createDraft('nothing');
            }}
          >
            Save as Drafts
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
