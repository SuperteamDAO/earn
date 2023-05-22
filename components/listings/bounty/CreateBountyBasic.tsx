import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Select,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import moment from 'moment';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import type { MultiSelectOptions } from '../../../constants';
import { SkillSelect } from '../../misc/SkillSelect';
import type { BountyBasicType } from './Createbounty';

interface Props {
  bountyBasic: BountyBasicType | undefined;
  setbountyBasic: Dispatch<SetStateAction<BountyBasicType | undefined>>;
  setSteps: Dispatch<SetStateAction<number>>;
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  skills: MultiSelectOptions[];
  createDraft: (payment: string) => void;
  draftLoading: boolean;
}
interface ErrorsBasic {
  title: boolean;
  slug: boolean;
  deadline: boolean;
  eligibility: boolean;
  skills: boolean;
  subSkills: boolean;
}
export const CreatebountyBasic = ({
  setbountyBasic,
  setSteps,
  setSkills,
  setSubSkills,
  skills,
  subSkills,
  bountyBasic,
  createDraft,
  draftLoading,
}: Props) => {
  console.log('file: CreateBountyBasic.tsx:51 ~ bountyBasic:', bountyBasic);
  const [errorState, setErrorState] = useState<ErrorsBasic>({
    deadline: false,
    eligibility: false,
    title: false,
    slug: false,
    subSkills: false,
    skills: false,
  });

  const date = moment().format('YYYY-MM-DD');

  return (
    <>
      <VStack align={'start'} gap={3} w={'2xl'} pt={7} pb={12}>
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
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                title: e.target.value,
              });
            }}
            placeholder="Develop a new landing page"
            value={bountyBasic?.title}
          />
          <FormErrorMessage>
            {/* {errors.title ? <>{errors.title.message}</> : <></>} */}
          </FormErrorMessage>
        </FormControl>
        <FormControl w="full" isInvalid={errorState.slug} isRequired>
          <Flex>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'slug'}
            >
              Opportunity Slug
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
              label={`Use a unique slug to open the opportunity`}
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
            id="slug"
            onChange={(e) => {
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                slug: e.target.value,
              });
            }}
            placeholder="develop-a-new-landing-page-1"
            value={bountyBasic?.slug}
          />
          <FormErrorMessage>
            {/* {errors.title ? <>{errors.title.message}</> : <></>} */}
          </FormErrorMessage>
        </FormControl>
        <FormControl
          w="full"
          mb={5}
          isInvalid={errorState.eligibility}
          isRequired
        >
          <Flex>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'eligility'}
            >
              Listing Type
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

          <Select
            onChange={(e) => {
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                eligibility: e.target.value,
              });
            }}
            placeholder="Choose the type of bounty"
            value={bountyBasic?.eligibility}
          >
            <option value="premission-less">
              Permissionless Bounty - anyone can apply
            </option>
            <option value="premission">
              Permissioned Bounty - only selected people can work on the bounty
            </option>
          </Select>
          <FormErrorMessage>
            {/* {errors.eligibility ? <>{errors.eligibility.message}</> : <></>} */}
          </FormErrorMessage>
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
              label={`Who will respond to questions about the opportunity from your team?`}
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
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                deadline: e.target.value,
              });
            }}
            placeholder="deadline"
            type={'datetime-local'}
            value={bountyBasic?.deadline}
          />
          <FormErrorMessage>
            {/* {errors.deadline ? <>{errors.deadline.message}</> : <></>} */}
          </FormErrorMessage>
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
                deadline: !bountyBasic?.deadline,
                eligibility: !bountyBasic?.eligibility,
                skills: skills.length === 0,
                subSkills: subSkills.length === 0,
                title: !bountyBasic?.title,
                slug: !bountyBasic?.slug,
              });

              if (
                bountyBasic?.deadline &&
                bountyBasic?.eligibility &&
                bountyBasic?.title &&
                bountyBasic?.slug &&
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
              createDraft('nothing');
            }}
          >
            Save as Draft
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
