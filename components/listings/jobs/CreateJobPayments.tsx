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
import axios from 'axios';
import { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
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
  editorData: string | undefined;
  mainSkills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  onOpen: () => void;
  createDraft: (payment: string) => void;
  setSlug: Dispatch<SetStateAction<string>>;
  draftLoading: boolean;
}
interface PaymentsState {
  max_eq: string;
  min_eq: string;
  min_sal: string;
  max_sal: string;
  exp: string;
}
interface ErrorState {
  max_eq: boolean;
  min_eq: boolean;
  min_sal: boolean;
  max_sal: boolean;
  exp: boolean;
}
export const CreateJobPayments = ({
  jobBasics,
  editorData,
  mainSkills,
  onOpen,
  subSkills,
  createDraft,
  draftLoading,
  setSlug,
}: Props) => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();
  const { currentSponsor } = SponsorStore();
  const [location, setLocation] = useState<string>('');
  const [timeZone, setTimeZone] = useState<MultiSelectOptions[]>([]);
  const [irlSpace, setIrlSpace] = useState<string>('');
  const animatedComponents = makeAnimated();
  const [loading, setLoading] = useState<boolean>(false);
  // payment values
  const [payment, setPayment] = useState<PaymentsState>();
  const [errorState, setErrorState] = useState<ErrorState>();

  //
  const onSubmit = async () => {
    setLoading(true);
    const info: JobsType = {
      active: true,
      deadline: jobBasics?.deadline ?? '',
      description: JSON.stringify(editorData),
      featured: false,
      id: genrateuuid(),
      jobType: jobBasics?.type as JobType,
      maxEq: Number(payment?.max_eq),
      minEq: Number(payment?.min_eq),
      maxSalary: Number(payment?.max_sal),
      minSalary: Number(payment?.min_sal),
      orgId: currentSponsor?.orgId ?? '',
      skills: JSON.stringify(mainSkills),
      source: 'native',
      subskills: JSON.stringify(subSkills),
      title: jobBasics?.title ?? '',
      location: location === 'In Person' ? irlSpace : location,
      link: jobBasics?.link ?? '',
      experience: payment?.exp as string,
      timezone: JSON.stringify(timeZone),
    };
    const res = await createJob(info);
    console.log(res);

    if (res && res.data.code === 201) {
      await axios.post('/api/updateSearch');
      onOpen();
      setSlug(('/jobs/' + jobBasics?.title.split(' ').join('-')) as string);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };
  return (
    <>
      <VStack
        pb={10}
        color={'gray.700'}
        gap={2}
        pt={7}
        align={'start'}
        w={'2xl'}
      >
        <FormControl isRequired>
          <FormLabel
            color={'gray.500'}
            fontWeight={600}
            fontSize={'15px'}
            htmlFor={'exp'}
          >
            Location Type
          </FormLabel>

          <Select
            id="exp"
            placeholder="Location"
            color={'gray.700'}
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
              color={'gray.500'}
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
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  color: 'gray.600',
                }),
              }}
              options={TimeZoneList}
              onChange={(e) => {
                setTimeZone(e as any);
              }}
            />
          </FormControl>
        )}
        {location === 'In Person' && (
          <FormControl w="full" isRequired isInvalid={errorState?.min_sal}>
            <Flex>
              <FormLabel
                color={'gray.500'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'location'}
              >
                Location
              </FormLabel>
            </Flex>

            <Input
              color={'gray.700'}
              placeholder="City, Country"
              onChange={(e) => {
                setIrlSpace(e.target.value);
              }}
            />
            <FormErrorMessage></FormErrorMessage>
          </FormControl>
        )}

        <FormControl my={5} isRequired isInvalid={errorState?.exp}>
          <FormLabel
            color={'gray.500'}
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
            onChange={(e) => {
              setPayment({
                ...(payment as PaymentsState),
                exp: e.target.value,
              });
            }}
            defaultValue={ExperienceList[0]}
            color={'gray.700'}
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
        <HStack w={'full'} my={6}>
          <FormControl w="full" isRequired isInvalid={errorState?.min_sal}>
            <Flex>
              <FormLabel
                color={'gray.500'}
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
              color={'gray.700'}
              placeholder="100,000"
              onChange={(e) => {
                setPayment({
                  ...(payment as PaymentsState),
                  min_sal: e.target.value,
                });
              }}
            />
            <FormErrorMessage>
              {errors.min_sal ? <>{errors.min_sal.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl w="full" isRequired isInvalid={errorState?.max_sal}>
            <Flex>
              <FormLabel
                color={'gray.500'}
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
              color={'gray.700'}
              type={'number'}
              onChange={(e) => {
                setPayment({
                  ...(payment as PaymentsState),
                  max_sal: e.target.value,
                });
              }}
            />
            <FormErrorMessage>
              {errors.max_sal ? <>{errors.max_sal.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
        </HStack>
        <HStack w={'full'}>
          <FormControl w="full" isRequired isInvalid={errorState?.min_eq}>
            <Flex>
              <FormLabel
                color={'gray.500'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'min-eq'}
              >
                Minimum Equity
              </FormLabel>
            </Flex>

            <Input
              color={'gray.700'}
              id="min-eq"
              placeholder="0.5%"
              onChange={(e) => {
                setPayment({
                  ...(payment as PaymentsState),
                  min_eq: e.target.value,
                });
              }}
            />
            <FormErrorMessage>
              {errors.min_eq ? <>{errors.min_eq.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl w="full" isRequired isInvalid={errorState?.max_eq}>
            <Flex>
              <FormLabel
                color={'gray.500'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'max_eq'}
              >
                Maximum Equity
              </FormLabel>
            </Flex>

            <Input
              color={'gray.700'}
              id="max_eq"
              max={100}
              onChange={(e) => {
                setPayment({
                  ...(payment as PaymentsState),
                  max_eq: e.target.value,
                });
              }}
              placeholder="5%"
            />
            <FormErrorMessage>
              {errors.max_eq ? <>{errors.max_eq.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
        </HStack>
        <VStack gap={6} w={'full'} mt={10}>
          <Button
            w="100%"
            bg={'#6562FF'}
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            onClick={() => {
              setErrorState({
                exp: payment?.exp ? false : true,
                max_eq: payment?.max_eq ? false : true,
                min_eq: payment?.min_eq ? false : true,
                max_sal: payment?.max_sal ? false : true,
                min_sal: payment?.min_sal ? false : true,
              });

              if (Number(payment?.max_eq) > 100) {
                setErrorState({
                  ...(errorState as ErrorState),
                  max_eq: true,
                });
                toast.error('Maximum Equity Cannot Be More Than 100%');
                return;
              }
              if (Number(payment?.max_eq) < Number(payment?.min_eq)) {
                toast.error(
                  'Minimum Equity Cannot Be More Than Maximum Equity'
                );
                setErrorState({
                  ...(errorState as ErrorState),
                  max_eq: true,
                  min_eq: true,
                });
                return;
              }
              if (Number(payment?.max_sal) < Number(payment?.min_sal)) {
                toast.error(
                  'Minimum Salary Cannot Be More Than Maximum Salary'
                );
                setErrorState({
                  ...(errorState as ErrorState),
                  max_sal: true,
                  min_sal: true,
                });
                return;
              }
              if (
                payment?.exp &&
                payment.max_eq &&
                payment.max_eq &&
                payment.min_eq &&
                payment.min_sal
              ) {
                onSubmit();
              }
            }}
            _hover={{ bg: '#6562FF' }}
            isLoading={loading}
            disabled={loading}
          >
            Finish the Listing
          </Button>
          <Button
            w="100%"
            fontSize="1rem"
            fontWeight={600}
            color="gray.500"
            border="1px solid"
            borderColor="gray.200"
            bg="transparent"
            isLoading={draftLoading}
            onClick={() => {
              createDraft(
                JSON.stringify({
                  payment,
                  location,
                  timeZone,
                })
              );
            }}
          >
            Save as Drafts
          </Button>
        </VStack>
      </VStack>
      <Toaster />
    </>
  );
};
