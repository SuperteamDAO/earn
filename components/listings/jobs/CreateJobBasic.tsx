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
import moment from 'moment';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';

import type { MultiSelectOptions } from '../../../constants';
import type { JobBasicsType } from '../../../interface/listings';
import type { JobType } from '../../../interface/types';
import { SkillSelect } from '../../misc/SkillSelect';

interface Props {
  setSteps: Dispatch<SetStateAction<number>>;
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  skills: MultiSelectOptions[];
  jobBasics: JobBasicsType | undefined;
  setJobBasic: Dispatch<SetStateAction<JobBasicsType | undefined>>;
  createDraft: () => void;
  draftLoading: boolean;
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
  draftLoading,
}: Props) => {
  //
  const [errorState, setErrorState] = useState<ErrorsBasic>({
    deadline: false,
    title: false,
    subSkills: false,
    skills: false,
    link: false,
    type: false,
  });
  const date = moment().format('YYYY-MM-DD');
  return (
    <>
      <VStack align={'start'} w={'2xl'} py={7}>
        <FormControl w="full" isInvalid={errorState.title} isRequired>
          <Flex>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'title'}
            >
              Opportunity Title
            </FormLabel>
            <Tooltip
              w="max"
              p="0.7rem"
              color="white"
              fontSize="0.9rem"
              fontWeight={600}
              bg="#6562FF"
              borderRadius="0.5rem"
              hasArrow
              label={`Use a short title to describe the opportunity`}
              placement="right-end"
            >
              <Image
                mt={-2}
                alt={'Info Icon'}
                src={'/assets/icons/info-icon.svg'}
              />
            </Tooltip>
          </Flex>

          <Input
            id="title"
            onChange={(e) => {
              setJobBasic({
                ...(jobBasics as JobBasicsType),
                title: e.target.value,
              });
            }}
            placeholder="Develop a new landing page"
            value={jobBasics?.title}
          />
          <FormErrorMessage></FormErrorMessage>
        </FormControl>
        <FormControl my={5} isInvalid={errorState.type} isRequired>
          <FormLabel
            color={'gray.500'}
            fontSize={'15px'}
            fontWeight={600}
            htmlFor={'title'}
          >
            Job Type
          </FormLabel>
          <Select
            color={'gray.700'}
            _placeholder={{
              color: 'gray.400',
            }}
            defaultValue={'fulltime'}
            onChange={(e) => {
              setJobBasic({
                ...(jobBasics as JobBasicsType),
                type: e.target.value as JobType,
              });
            }}
            placeholder={'Job Type'}
            value={jobBasics?.type}
          >
            <option value="fulltime">Full Time</option>
            <option value="internship">Intership</option>
            <option value="parttime">Part Time</option>
          </Select>
          <FormControl my={5} isInvalid={errorState.link} isRequired>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'application_link'}
            >
              Application Link
            </FormLabel>

            <InputGroup>
              <InputLeftElement
                h="100%"
                ml="0.5rem"
                pointerEvents="none"
                // eslint-disable-next-line react/no-children-prop
                children={
                  <Flex align="center" justify="center" w="2rem" h="2rem">
                    <Image
                      alt="Link Icon"
                      src={'/assets/icons/gray-link.svg'}
                    />
                  </Flex>
                }
              />
              <Input
                p="0 4rem"
                fontSize="1rem"
                fontWeight={500}
                focusBorderColor="#CFD2D7"
                onChange={(e) => {
                  setJobBasic({
                    ...(jobBasics as JobBasicsType),
                    link: e.target.value,
                  });
                }}
                placeholder="Where are you collecting applications for this work"
                value={jobBasics?.link}
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
        <FormControl isInvalid={errorState.deadline} isRequired>
          <Flex align={'center'} justify={'start'}>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'deadline'}
            >
              Deadline
            </FormLabel>
            <Tooltip
              w="max"
              p="0.7rem"
              color="white"
              fontSize="0.9rem"
              fontWeight={600}
              bg="#6562FF"
              borderRadius="0.5rem"
              hasArrow
              label={`Select the deadline date for accepting submissions`}
              placement="right-end"
            >
              <Image
                mt={-2}
                alt={'Info Icon'}
                src={'/assets/icons/info-icon.svg'}
              />
            </Tooltip>
          </Flex>
          <Input
            w={'full'}
            color={'gray.500'}
            id="deadline"
            min={`${date}T00:00`}
            onChange={(e) => {
              setJobBasic({
                ...(jobBasics as JobBasicsType),
                deadline: e.target.value,
              });
            }}
            placeholder="deadline"
            type={'datetime-local'}
            value={jobBasics?.deadline}
          />
          <FormErrorMessage></FormErrorMessage>
        </FormControl>
        <VStack gap={6} w={'full'} pt={10}>
          <Button
            w="100%"
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            onClick={() => {
              setErrorState({
                deadline: !jobBasics?.deadline,
                skills: skills.length === 0,
                subSkills: subSkills.length === 0,
                title: !jobBasics?.title,
                link: !jobBasics?.link,
                type: !jobBasics?.type,
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
            color="gray.500"
            fontSize="1rem"
            fontWeight={600}
            bg="transparent"
            border="1px solid"
            borderColor="gray.200"
            isLoading={draftLoading}
            onClick={() => {
              createDraft();
            }}
          >
            Save as Drafts
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
