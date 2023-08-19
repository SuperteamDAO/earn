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
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import type { MultiSelectOptions } from '../../../constants';
import { ExperienceList, TimeZoneList } from '../../../constants';
import type { JobBasicsType, JobsType } from '../../../interface/listings';
import type { JobType } from '../../../interface/types';
import { SponsorStore } from '../../../store/sponsor';
import { createJob } from '../../../utils/functions';
import { genrateuuid } from '../../../utils/helpers';

interface Props {
  jobBasics: JobBasicsType | undefined;
  editorData: string | undefined;
  mainSkills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  onOpen: () => void;
  createDraft: () => void;
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
      orgId: currentSponsor?.id ?? '',
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
      onOpen();
      setSlug(`/jobs/${jobBasics?.title.split(' ').join('-')}` as string);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };
  return (
    <>
      <VStack
        align={'start'}
        gap={2}
        w={'2xl'}
        pt={7}
        pb={10}
        color={'gray.700'}
      >
        <FormControl isRequired>
          <FormLabel
            color={'gray.500'}
            fontSize={'15px'}
            fontWeight={600}
            htmlFor={'exp'}
          >
            Location Type
          </FormLabel>

          <Select
            color={'gray.700'}
            id="exp"
            onChange={(e) => {
              setLocation(e.target.value);
            }}
            placeholder="Location"
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
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'exp'}
            >
              Time Zone
            </FormLabel>

            <ReactSelect
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              styles={{
                control: (baseStyles) => ({
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
          <FormControl w="full" isInvalid={errorState?.min_sal} isRequired>
            <Flex>
              <FormLabel
                color={'gray.500'}
                fontSize={'15px'}
                fontWeight={600}
                htmlFor={'location'}
              >
                Location
              </FormLabel>
            </Flex>

            <Input
              color={'gray.700'}
              onChange={(e) => {
                setIrlSpace(e.target.value);
              }}
              placeholder="City, Country"
            />
            <FormErrorMessage></FormErrorMessage>
          </FormControl>
        )}

        <FormControl my={5} isInvalid={errorState?.exp} isRequired>
          <FormLabel
            color={'gray.500'}
            fontSize={'15px'}
            fontWeight={600}
            htmlFor={'exp'}
          >
            Experience
          </FormLabel>

          <Select
            id="exp"
            placeholder="Estimated Time to complete"
            {...register('exp')}
            color={'gray.700'}
            defaultValue={ExperienceList[0]}
            onChange={(e) => {
              setPayment({
                ...(payment as PaymentsState),
                exp: e.target.value,
              });
            }}
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
          <FormControl w="full" isInvalid={errorState?.min_sal} isRequired>
            <Flex>
              <FormLabel
                color={'gray.500'}
                fontSize={'15px'}
                fontWeight={600}
                htmlFor={'min_sal'}
              >
                Minimum Salary (USD)
              </FormLabel>
            </Flex>

            <Input
              color={'gray.700'}
              id="min_sal"
              onChange={(e) => {
                setPayment({
                  ...(payment as PaymentsState),
                  min_sal: e.target.value,
                });
              }}
              placeholder="100,000"
              type={'number'}
            />
            <FormErrorMessage>
              {errors.min_sal ? <>{errors.min_sal.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl w="full" isInvalid={errorState?.max_sal} isRequired>
            <Flex>
              <FormLabel
                color={'gray.500'}
                fontSize={'15px'}
                fontWeight={600}
                htmlFor={'max_sal'}
              >
                Maximum Salary (USD)
              </FormLabel>
            </Flex>

            <Input
              color={'gray.700'}
              id="max_sal"
              onChange={(e) => {
                setPayment({
                  ...(payment as PaymentsState),
                  max_sal: e.target.value,
                });
              }}
              placeholder="150,000"
              type={'number'}
            />
            <FormErrorMessage>
              {errors.max_sal ? <>{errors.max_sal.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
        </HStack>
        <HStack w={'full'}>
          <FormControl w="full" isInvalid={errorState?.min_eq} isRequired>
            <Flex>
              <FormLabel
                color={'gray.500'}
                fontSize={'15px'}
                fontWeight={600}
                htmlFor={'min-eq'}
              >
                Minimum Equity
              </FormLabel>
            </Flex>

            <Input
              color={'gray.700'}
              id="min-eq"
              onChange={(e) => {
                setPayment({
                  ...(payment as PaymentsState),
                  min_eq: e.target.value,
                });
              }}
              placeholder="0.5%"
            />
            <FormErrorMessage>
              {errors.min_eq ? <>{errors.min_eq.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl w="full" isInvalid={errorState?.max_eq} isRequired>
            <Flex>
              <FormLabel
                color={'gray.500'}
                fontSize={'15px'}
                fontWeight={600}
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
            color={'white'}
            fontSize="1rem"
            fontWeight={600}
            bg={'#6562FF'}
            _hover={{ bg: '#6562FF' }}
            disabled={loading}
            isLoading={loading}
            onClick={() => {
              setErrorState({
                exp: !payment?.exp,
                max_eq: !payment?.max_eq,
                min_eq: !payment?.min_eq,
                max_sal: !payment?.max_sal,
                min_sal: !payment?.min_sal,
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
          >
            Finish the Listing
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
      <Toaster />
    </>
  );
};
