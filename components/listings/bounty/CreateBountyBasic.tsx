import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Select,
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
export const CreatebountyBasic = ({
  setbountyBasic,
  setSteps,
  setSkills,
  setSubSkills,
  skills,
  subSkills,
  bountyBasic,
}: Props) => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();

  // holds the change in state

  const animatedComponents = makeAnimated();
  return (
    <>
      <VStack pt={7} align={'start'} w={'2xl'}>
        <form
          onSubmit={handleSubmit((e) => {
            setbountyBasic({
              title: e.title,
              deadline: e.deadline,
              eligibility: e.eligibility,
            });
            setSteps(3);
          })}
          style={{ width: '100%' }}
        >
          <FormControl mb={5} w="full" isRequired>
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
              value={bountyBasic && bountyBasic.title}
              {...register('title')}
            />
            <FormErrorMessage>
              {errors.title ? <>{errors.title.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl mb={5} w="full" isRequired>
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
              value={bountyBasic?.eligibility}
              {...register('eligibility')}
            />
            <FormErrorMessage>
              {errors.eligibility ? <>{errors.eligibility.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>

          <FormControl my={6}>
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
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              options={MainSkills}
              onChange={(e) => {
                setSkills(e as any);
              }}
            />
          </FormControl>
          <FormControl my={6} isInvalid={true}>
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
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              options={SubSkills}
              onChange={(e) => {
                setSubSkills(e as any);
              }}
            />
          </FormControl>
          <FormControl isRequired>
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
              value={bountyBasic && bountyBasic.deadline}
              color={'gray.500'}
              {...register('deadline')}
            />
            <FormErrorMessage>
              {errors.deadline ? <>{errors.deadline.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <VStack gap={6} mt={10}>
            <Button
              w="100%"
              bg={'#6562FF'}
              _hover={{ bg: '#6562FF' }}
              color={'white'}
              fontSize="1rem"
              fontWeight={600}
              type={'submit'}
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
        </form>
      </VStack>
    </>
  );
};
