import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Select,
  VStack,
} from '@chakra-ui/react';
import { OutputData } from '@editorjs/editorjs';
import { useForm } from 'react-hook-form';
import { ExperienceList, MultiSelectOptions } from '../../../constants';
import { JobBasicsType } from '../../../interface/listings';

interface Props {
  jobBasics: JobBasicsType | undefined;
  editorData: OutputData | undefined;
  mainSkills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  onOpen: () => void;
}
export const CreateJobPayments = ({
  jobBasics,
  editorData,
  mainSkills,
  onOpen,
  subSkills,
}: Props) => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();
  return (
    <>
      <VStack pb={10} color={'gray.500'} pt={7} align={'start'} w={'2xl'}>
        <form style={{ width: '100%' }}>
          <FormControl isRequired>
            <FormLabel
              color={'gray.400'}
              fontWeight={600}
              fontSize={'15px'}
              htmlFor={'exp'}
            >
              Experience
            </FormLabel>

            <Select
              id="exp"
              placeholder="Estimated Time to complete"
              {...register('exp')}
              defaultValue={ExperienceList[0]}
              color={'gray.500'}
            >
              {ExperienceList.map((el) => {
                return (
                  <option key={el} value={el}>
                    {el}
                  </option>
                );
              })}
            </Select>
            <FormErrorMessage>
              {errors.time ? <>{errors.time.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <HStack my={6}>
            <FormControl w="full" isRequired>
              <Flex>
                <FormLabel
                  color={'gray.400'}
                  fontWeight={600}
                  fontSize={'15px'}
                  htmlFor={'min_sal'}
                >
                  Minimum Salary (USD)
                </FormLabel>
              </Flex>

              <Input
                id="min_sal"
                type={'number'}
                placeholder="100,000"
                {...register('min_sal')}
              />
              <FormErrorMessage>
                {errors.min_sal ? <>{errors.min_sal.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
            <FormControl w="full" isRequired>
              <Flex>
                <FormLabel
                  color={'gray.400'}
                  fontWeight={600}
                  fontSize={'15px'}
                  htmlFor={'max_sal'}
                >
                  Maximum Salary (USD)
                </FormLabel>
              </Flex>

              <Input
                id="max_sal"
                placeholder="150,000"
                type={'number'}
                {...register('max_sal')}
              />
              <FormErrorMessage>
                {errors.max_sal ? <>{errors.max_sal.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
          </HStack>
          <HStack>
            <FormControl w="full" isRequired>
              <Flex>
                <FormLabel
                  color={'gray.400'}
                  fontWeight={600}
                  fontSize={'15px'}
                  htmlFor={'min-eq'}
                >
                  Minimum Equity
                </FormLabel>
              </Flex>

              <Input id="min-eq" placeholder="0.5%" {...register('min_eq')} />
              <FormErrorMessage>
                {errors.min_eq ? <>{errors.min_eq.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
            <FormControl w="full" isRequired>
              <Flex>
                <FormLabel
                  color={'gray.400'}
                  fontWeight={600}
                  fontSize={'15px'}
                  htmlFor={'max_eq'}
                >
                  Maximum Equity
                </FormLabel>
              </Flex>

              <Input
                id="max_eq"
                placeholder="5%"
                type={'number'}
                {...register('max_eq')}
              />
              <FormErrorMessage>
                {errors.max_eq ? <>{errors.max_eq.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
          </HStack>

          <VStack gap={6} mt={10}>
            <Button
              w="100%"
              bg={'#6562FF'}
              color={'white'}
              fontSize="1rem"
              fontWeight={600}
              type={'submit'}
            >
              Finish the listing
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
