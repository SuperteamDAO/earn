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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';
import {
  ExperienceList,
  MultiSelectOptions,
  TimeZoneList,
} from '../../../constants';
import { JobBasicsType, JobsType } from '../../../interface/listings';
import { JobType } from '../../../interface/types';
import { SponsorStore } from '../../../store/sponsor';
import { createJob } from '../../../utils/functions';
import { genrateuuid } from '../../../utils/helpers';

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
  const { currentSponsor } = SponsorStore();
  const [location, setLocation] = useState<string>('');
  const [timeZone, setTimeZone] = useState<MultiSelectOptions[]>([]);
  const animatedComponents = makeAnimated();
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <>
      <VStack pb={10} color={'gray.500'} pt={7} align={'start'} w={'2xl'}>
        <form
          onSubmit={handleSubmit(async (e) => {
            setLoading(true);
            console.log(e);
            const info: JobsType = {
              active: true,
              deadline: jobBasics?.deadline ?? '',
              description: JSON.stringify(editorData),
              featured: false,
              id: genrateuuid(),
              jobType: jobBasics?.type as JobType,
              maxEq: Number(e.max_eq),
              minEq: Number(e.min_eq),
              maxSalary: Number(e.max_sal),
              minSalary: Number(e.min_sal),
              orgId: currentSponsor?.orgId ?? '',
              skills: JSON.stringify(mainSkills),
              source: 'native',
              subskills: JSON.stringify(subSkills),
              title: jobBasics?.title ?? '',
              location: location,
              experience: e.exp,
              timezone: JSON.stringify(timeZone),
            };
            const res = await createJob(info);
            console.log(res);

            if (res && res.data.code === 201) {
              onOpen();
              setLoading(false);
            } else {
              setLoading(false);
            }
          })}
          style={{ width: '100%' }}
        >
          <FormControl isRequired>
            <FormLabel
              color={'gray.400'}
              fontWeight={600}
              fontSize={'15px'}
              htmlFor={'exp'}
            >
              Location
            </FormLabel>

            <Select
              id="exp"
              placeholder="Location"
              color={'gray.500'}
              onChange={(e) => {
                setLocation(e.target.value);
              }}
            >
              {['Remote', 'In Person'].map((el) => {
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
          {location === 'Remote' && (
            <FormControl mt={5} isRequired>
              <FormLabel
                color={'gray.400'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'exp'}
              >
                Time Zone
              </FormLabel>

              <ReactSelect
                closeMenuOnSelect={false}
                components={animatedComponents}
                isMulti
                options={TimeZoneList}
                onChange={(e) => {
                  setTimeZone(e as any);
                }}
              />
            </FormControl>
          )}

          <FormControl my={5} isRequired>
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

              <Input id="max_eq" placeholder="5%" {...register('max_eq')} />
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
              _hover={{ bg: '#6562FF' }}
              isLoading={loading}
              disabled={loading}
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
