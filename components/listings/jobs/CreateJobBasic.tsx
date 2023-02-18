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
import React from 'react';
import { useForm } from 'react-hook-form';

export const CreateJobBasic = () => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();
  return (
    <>
      <VStack py={7} align={'start'} w={'full'}>
        <form onSubmit={handleSubmit((e) => {})} style={{ width: '100%' }}>
          <FormControl w="full" isRequired>
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
              {...register('title')}
            />
            <FormErrorMessage>
              {errors.title ? <>{errors.title.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl my={5} isRequired>
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
            <Select {...register('jobtype')}>
              <option value="fulltime">Full Time</option>
              <option value="internship">Intership</option>
              <option value="parttime">Part Time</option>
            </Select>
            <FormControl my={5} isRequired>
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
                  placeholder="Where are you collecting applications for this work"
                  {...register('application_link')}
                />
              </InputGroup>
            </FormControl>
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
