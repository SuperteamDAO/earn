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
import type { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import type { MultiSelectOptions } from '../../../constants';
import { MainSkills, SubSkills } from '../../../constants';
import type { GrantsBasicType } from '../../../interface/listings';

interface Props {
  grantBasic: GrantsBasicType | undefined;
  setSteps: Dispatch<SetStateAction<number>>;
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setGrantBasic: Dispatch<SetStateAction<GrantsBasicType | undefined>>;
  createDraft?: (payment: string) => void;
}
export const CreateGrantsBasic = ({
  setSkills,
  setSteps,
  setSubSkills,
  setGrantBasic,
  grantBasic,
}: Props) => {
  const {
    formState: { errors },
  } = useForm();
  const animatedComponents = makeAnimated();

  return (
    <>
      <VStack align={'start'} gap={3} w={'2xl'} pb={10} color={'gray.500'}>
        <FormControl w="full" isRequired>
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
            color={'gray.700'}
            id="title"
            onChange={(e) => {
              setGrantBasic({
                ...(grantBasic as GrantsBasicType),
                title: e.target.value,
              });
            }}
            placeholder="Develop a new landing page"
            value={grantBasic?.title}
          />
          <FormErrorMessage></FormErrorMessage>
        </FormControl>

        <FormControl w="full" isRequired>
          <Flex align={'center'} justify={'start'}>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'contact'}
            >
              Application Link
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
            color={'gray.700'}
            id="link"
            onChange={(e) => {
              setGrantBasic({
                ...(grantBasic as GrantsBasicType),
                link: e.target.value,
              });
            }}
            placeholder="link to application form"
            value={grantBasic?.link}
          />
          <FormErrorMessage>
            {errors.contact ? <>{errors.contact.message}</> : <></>}
          </FormErrorMessage>
        </FormControl>
        <FormControl w="full" isRequired>
          <Flex align={'center'} justify={'start'}>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'contact'}
            >
              Point of Contact
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
            color={'gray.700'}
            id="handle"
            onChange={(e) => {
              setGrantBasic({
                ...(grantBasic as GrantsBasicType),
                contact: e.target.value,
              });
            }}
            placeholder="@telegram handle"
            value={grantBasic?.contact}
          />
          <FormErrorMessage>
            {errors.contact ? <>{errors.contact.message}</> : <></>}
          </FormErrorMessage>
        </FormControl>
        <FormControl my={6}>
          <Flex align={'center'} justify={'start'}>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'skills'}
            >
              Skills Needed
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
              label={`Select all that apply`}
              placement="right-end"
            >
              <Image
                mt={-2}
                alt={'Info Icon'}
                src={'/assets/icons/info-icon.svg'}
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
        <FormControl my={6}>
          <Flex align={'center'} justify={'start'}>
            <FormLabel
              color={'gray.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'skills'}
            >
              Sub Skills Needed
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
              label={`Select all that apply`}
              placement="right-end"
            >
              <Image
                mt={-2}
                alt={'Info Icon'}
                src={'/assets/icons/info-icon.svg'}
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
        <VStack gap={6} w={'full'} mt={10}>
          <Button
            w="100%"
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            onClick={() => {
              setSteps(3);
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
          >
            Save as Drafts
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
