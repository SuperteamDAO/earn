import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Select,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import { SkillSelect } from '@/components/misc/SkillSelect';
import { dayjs } from '@/utils/dayjs';

import type { MultiSelectOptions } from '../../../constants';
import type { BountyBasicType } from './Createbounty';

interface Props {
  bountyBasic: BountyBasicType | undefined;
  setbountyBasic: Dispatch<SetStateAction<BountyBasicType | undefined>>;
  setSteps: Dispatch<SetStateAction<number>>;
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  skills: MultiSelectOptions[];
  createDraft: () => void;
  draftLoading: boolean;
  isEditMode: boolean;
}
interface ErrorsBasic {
  title: boolean;
  slug: boolean;
  deadline: boolean;
  type: boolean;
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
  isEditMode,
}: Props) => {
  const [defaultSlug, setDefaultSlug] = useState<string>(
    bountyBasic?.slug || ''
  );
  const [isValidatingSlug, setIsValidatingSlug] = useState<boolean>(false);
  const [validatingSlugMessage, setValidatingSlugMessage] =
    useState<string>('Validate Slug');
  const [errorState, setErrorState] = useState<ErrorsBasic>({
    deadline: false,
    type: false,
    title: false,
    slug: false,
    subSkills: false,
    skills: false,
  });

  const date = dayjs().format('YYYY-MM-DD');

  const validateSlug = async () => {
    setIsValidatingSlug(true);
    try {
      const res = await axios.get(`/api/bounties/${defaultSlug}/`);
      if (res.data) {
        setValidatingSlugMessage('🔴 Slug already exists!');
      } else {
        setValidatingSlugMessage('🟢 Slug is good to go!');
      }
      setIsValidatingSlug(false);
    } catch (e) {
      setValidatingSlugMessage('🟢 Slug is good to go!');
      setIsValidatingSlug(false);
    }
  };

  return (
    <>
      <VStack align={'start'} gap={3} w={'2xl'} pt={7} pb={12}>
        <FormControl w="full" isInvalid={errorState.title} isRequired>
          <Flex>
            <FormLabel
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'title'}
            >
              Listing Title
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
              label={`Use a short title to describe the Listing`}
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
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            id="title"
            onChange={(e) => {
              const slug = (e.target.value || '')
                .toLowerCase()
                .replaceAll(' ', '-')
                .replace(/[^A-Za-z0-9-]/g, '');
              setDefaultSlug(slug);
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                title: e.target.value,
                slug,
              });
              setValidatingSlugMessage('Validate Slug');
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
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'slug'}
            >
              Listing Slug
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
              label={`Use a unique slug to open the Listing`}
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
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            id="slug"
            onChange={(e) => {
              setDefaultSlug(e.target.value || '');
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                slug: e.target.value,
              });
              setValidatingSlugMessage('Validate Slug');
            }}
            placeholder="develop-a-new-landing-page-1"
            value={defaultSlug}
          />
          <Flex justify="end">
            <Text
              color="brand.slate.400"
              fontSize="xs"
              fontWeight={500}
              _hover={{
                color: bountyBasic?.slug ? 'brand.purple' : 'brand.slate.400',
              }}
              cursor={bountyBasic?.slug ? 'pointer' : 'not-allowed'}
              onClick={() => validateSlug()}
            >
              {isValidatingSlug ? 'Validating...' : validatingSlugMessage}
            </Text>
          </Flex>
          <FormErrorMessage>
            {/* {errors.title ? <>{errors.title.message}</> : <></>} */}
          </FormErrorMessage>
        </FormControl>
        <FormControl w="full" mb={5} isInvalid={errorState.type} isRequired>
          <Flex>
            <FormLabel
              color={'brand.slate.500'}
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
              label={`Choose which type of Listing you want to create`}
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
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            onChange={(e) => {
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                type: e.target.value,
              });
            }}
            placeholder="Choose the type of bounty"
            value={bountyBasic?.type}
          >
            <option value="open">
              Permissionless Bounty - anyone can apply
            </option>
            <option value="permissioned">
              Permissioned Bounty - only selected people can work on the bounty
            </option>
          </Select>
          <FormErrorMessage>
            {/* {errors.type ? <>{errors.type.message}</> : <></>} */}
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
              color={'brand.slate.500'}
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
            color={'brand.slate.500'}
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
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
        <VStack gap={4} w={'full'} pt={10}>
          <Button
            w="100%"
            onClick={() => {
              setErrorState({
                deadline: !bountyBasic?.deadline,
                type: !bountyBasic?.type,
                skills: skills.length === 0,
                subSkills: subSkills.length === 0,
                title: !bountyBasic?.title,
                slug: !bountyBasic?.slug,
              });

              if (
                bountyBasic?.deadline &&
                bountyBasic?.type &&
                bountyBasic?.title &&
                bountyBasic?.slug &&
                skills.length !== 0 &&
                subSkills.length !== 0
              ) {
                setSteps(3);
              }
            }}
            variant="solid"
          >
            Continue
          </Button>
          <Button
            w="100%"
            isDisabled={!bountyBasic?.title || !bountyBasic?.slug}
            isLoading={draftLoading}
            onClick={() => {
              createDraft();
            }}
            variant="outline"
          >
            {isEditMode ? 'Update' : 'Save as Draft'}
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
