import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';
import { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BountyBasicType } from './Createbounty';
import { MainSkills, MultiSelectOptions, SubSkills } from '../../../constants';
interface Props {
  bountyBasic: BountyBasicType | undefined;
  setbountyBasic: Dispatch<SetStateAction<BountyBasicType | undefined>>;
  setSteps: Dispatch<SetStateAction<number>>;
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  subSkills: MultiSelectOptions[];
  skills: MultiSelectOptions[];
}
interface ErrorsBasic {
  title: boolean;
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
}: Props) => {
  const [errorState, setErrorState] = useState<ErrorsBasic>({
    deadline: false,
    eligibility: false,
    title: false,
    subSkills: false,
    skills: false,
  });

  const animatedComponents = makeAnimated();
  return (
    <>
      <VStack pt={7} align={'start'} w={'2xl'}>
        <FormControl mb={5} w="full" isRequired isInvalid={errorState.title}>
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
            onChange={(e) => {
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                title: e.target.value,
              });
            }}
          />
          <FormErrorMessage>
            {/* {errors.title ? <>{errors.title.message}</> : <></>} */}
          </FormErrorMessage>
        </FormControl>
        <FormControl
          mb={5}
          w="full"
          isRequired
          isInvalid={errorState.eligibility}
        >
          <Flex>
            <FormLabel
              color={'gray.400'}
              fontWeight={600}
              fontSize={'15px'}
              htmlFor={'eligility'}
            >
              Eligibility
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
            id="eligibility"
            placeholder="Develop a new landing page"
            onChange={(e) => {
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                eligibility: e.target.value,
              });
            }}
          />
          <FormErrorMessage>
            {/* {errors.eligibility ? <>{errors.eligibility.message}</> : <></>} */}
          </FormErrorMessage>
        </FormControl>

        <FormControl my={6} isRequired>
          <Flex align={'center'} justify={'start'}>
            <FormLabel
              color={'gray.400'}
              fontWeight={600}
              fontSize={'15px'}
              htmlFor={'skills'}
            >
              Skills Needed
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
              label={`Select all that apply`}
            >
              <Image
                mt={-2}
                src={'/assets/icons/info-icon.svg'}
                alt={'Info Icon'}
              />
            </Tooltip>
          </Flex>
          <ReactSelect
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                border: errorState.skills ? '2px solid red' : baseStyles.border,
              }),
            }}
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            required={true}
            options={MainSkills}
            onChange={(e) => {
              setSkills(e as any);
            }}
          />
        </FormControl>
        <FormControl my={6}>
          <Flex align={'center'} justify={'start'}>
            <FormLabel
              color={'gray.400'}
              fontWeight={600}
              fontSize={'15px'}
              htmlFor={'skills'}
            >
              Sub Skills Needed
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
              label={`Select all that apply`}
            >
              <Image
                mt={-2}
                src={'/assets/icons/info-icon.svg'}
                alt={'Info Icon'}
              />
            </Tooltip>
          </Flex>
          <ReactSelect
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                border: errorState.subSkills
                  ? '2px solid red'
                  : baseStyles.border,
              }),
            }}
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            options={SubSkills}
            onChange={(e) => {
              setSubSkills(e as any);
            }}
          />
        </FormControl>
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
            onChange={(e) => {
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                deadline: e.target.value,
              });
            }}
          />
          <FormErrorMessage>
            {/* {errors.deadline ? <>{errors.deadline.message}</> : <></>} */}
          </FormErrorMessage>
        </FormControl>
        <VStack w={'full'} gap={6} pt={10}>
          <Button
            w="100%"
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            onClick={() => {
              setErrorState({
                deadline: bountyBasic?.deadline ? false : true,
                eligibility: bountyBasic?.eligibility ? false : true,
                skills: skills.length !== 0 ? false : true,
                subSkills: subSkills.length !== 0 ? false : true,
                title: bountyBasic?.title ? false : true,
              });
              console.log(
                !bountyBasic?.deadline,
                !bountyBasic?.eligibility,
                !bountyBasic?.title,
                skills.length === 0,
                subSkills.length === 0,
                !bountyBasic?.deadline &&
                  !bountyBasic?.eligibility &&
                  !bountyBasic?.title &&
                  skills.length === 0 &&
                  subSkills.length === 0
              );

              if (
                bountyBasic?.deadline &&
                bountyBasic?.eligibility &&
                bountyBasic?.title &&
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
          >
            Save as Drafts
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
