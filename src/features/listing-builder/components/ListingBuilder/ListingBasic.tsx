import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Select,
  Switch,
  Tag,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { Regions } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';

import { SkillSelect } from '@/components/misc/SkillSelect';
import type { MultiSelectOptions } from '@/constants';
import { Superteams } from '@/constants/Superteam';
import { dayjs } from '@/utils/dayjs';

import type { SuperteamName } from '../../types';
import type { BountyBasicType } from '../CreateListingForm';
import { SelectSponsor } from '../SelectSponsor';

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
  editable: boolean;
  regions: Regions;
  setRegions: Dispatch<SetStateAction<Regions>>;
  type: 'bounty' | 'project' | 'hackathon';
  timeToComplete?: string;
  isNewOrDraft?: boolean;
  isDuplicating?: boolean;
  referredBy?: SuperteamName;
  setReferredBy?: Dispatch<SetStateAction<SuperteamName | undefined>>;
  isPrivate: boolean;
  setIsPrivate: Dispatch<SetStateAction<boolean>>;
}
interface ErrorsBasic {
  title: boolean;
  deadline: boolean;
  skills: boolean;
  subSkills: boolean;
  pocSocials: boolean;
  timeToComplete: boolean;
}
export const ListingBasic = ({
  setbountyBasic,
  setSteps,
  setSkills,
  setSubSkills,
  skills,
  subSkills,
  bountyBasic,
  createDraft,
  draftLoading,
  regions,
  setRegions,
  type,
  isNewOrDraft,
  isDuplicating,
  referredBy,
  setReferredBy,
  isPrivate,
  setIsPrivate,
  editable,
}: Props) => {
  const [errorState, setErrorState] = useState<ErrorsBasic>({
    deadline: false,
    title: false,
    subSkills: false,
    skills: false,
    pocSocials: false,
    timeToComplete: false,
  });

  const deadlineOptions = [
    { label: '1 Week', value: 7 },
    { label: '2 Weeks', value: 14 },
    { label: '3 Weeks', value: 21 },
  ];

  const handleDeadlineSelection = (days: number) => {
    const deadlineDate = dayjs().add(days, 'day').format('YYYY-MM-DDTHH:mm');
    setbountyBasic({
      ...(bountyBasic as BountyBasicType),
      deadline: deadlineDate,
    });
  };

  const [isUrlValid, setIsUrlValid] = useState(true);

  const date = dayjs().format('YYYY-MM-DD');
  const thirtyDaysFromNow = dayjs().add(30, 'day').format('YYYY-MM-DDTHH:mm');

  const hasBasicInfo =
    bountyBasic?.title &&
    skills.length !== 0 &&
    subSkills.length !== 0 &&
    bountyBasic?.pocSocials &&
    isUrlValid;

  const timeToCompleteOptions = [
    { value: '<1 Week', label: '<1 Week' },
    { value: '1-2 Weeks', label: '1-2 Weeks' },
    { value: '2-4 Weeks', label: '2-4 Weeks' },
    { value: '4-8 Weeks', label: '4-8 Weeks' },
    { value: '>8 Weeks', label: '>8 Weeks' },
  ];

  const isTimeToCompleteValid = useMemo(() => {
    return timeToCompleteOptions.some(
      (option) => option.value === bountyBasic?.timeToComplete,
    );
  }, [bountyBasic?.timeToComplete, timeToCompleteOptions]);

  const isProject = type === 'project';

  const { data: session } = useSession();

  return (
    <>
      <VStack align={'start'} gap={3} w={'2xl'} pt={7} pb={12}>
        {type === 'hackathon' && !editable && (
          <Box w="100%" mb={5}>
            <SelectSponsor type="hackathon" />
          </Box>
        )}
        <FormControl w="full" mb={5} isInvalid={errorState.title} isRequired>
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

        <SkillSelect
          errorSkill={errorState.skills}
          errorSubSkill={errorState.subSkills}
          setSkills={setSkills}
          setSubSkills={setSubSkills}
          skills={skills}
          subSkills={subSkills}
        />
        {session?.user?.role === 'GOD' && (
          <>
            <FormControl w="full" mb={5}>
              <Flex>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                >
                  Listing Geography
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
                  label={`Select the Superteam region this listing will be available and relevant to. The geography selected here will determine which Superteam Geography page it shows up on. If the listing is open to all, please select global; otherwise, please select the specific country`}
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
                  setRegions(e.target.value as Regions);
                }}
                value={regions}
              >
                <option value={Regions.GLOBAL}>Global</option>
                {Superteams.map((st) => (
                  <option value={st.region} key={st.name}>
                    {st.displayValue}
                  </option>
                ))}
              </Select>
            </FormControl>
          </>
        )}
        <FormControl
          w="full"
          mb={5}
          isInvalid={errorState.pocSocials || !isUrlValid}
          isRequired
        >
          <Flex>
            <FormLabel
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
              htmlFor={'pocSocials'}
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
              label={`Please add a social link of the person people reach out to in case they have questions about this listing.`}
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
            id="pocSocials"
            onChange={(e) => {
              setbountyBasic({
                ...(bountyBasic as BountyBasicType),
                pocSocials: e.target.value,
              });
              setIsUrlValid(true);
            }}
            placeholder="https://twitter.com/elonmusk"
            value={bountyBasic?.pocSocials}
          />
          <FormErrorMessage>
            {/* {errors.title ? <>{errors.title.message}</> : <></>} */}
          </FormErrorMessage>
          {!isUrlValid && (
            <Text color={'red'}>
              URL needs to contain &quot;https://&quot; prefix
            </Text>
          )}
        </FormControl>
        {isProject && (
          <FormControl w="full" mb={5} isRequired={isProject}>
            <Flex>
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                Application Type
              </FormLabel>
            </Flex>

            <Select
              defaultValue={'fixed'}
              onChange={(e) => {
                setbountyBasic({
                  ...(bountyBasic as BountyBasicType),
                  applicationType: e.target.value as 'fixed' | 'rolling',
                });
              }}
              value={bountyBasic?.applicationType}
            >
              <option value="fixed">Fixed Deadline</option>
              <option value="rolling">Rolling Deadline</option>
            </Select>
          </FormControl>
        )}
        {type !== 'hackathon' && bountyBasic?.applicationType !== 'rolling' && (
          <FormControl
            mb={5}
            isInvalid={errorState.deadline}
            isRequired={
              bountyBasic?.applicationType
                ? bountyBasic.applicationType === 'fixed'
                : true
            }
          >
            <Flex align={'center'} justify={'start'}>
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
                htmlFor={'deadline'}
              >
                Deadline (in {Intl.DateTimeFormat().resolvedOptions().timeZone})
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
              css={{
                boxSizing: 'border-box',
                padding: '.75rem',
                position: 'relative',
                width: '100%',
                '&::-webkit-calendar-picker-indicator': {
                  background: 'transparent',
                  bottom: 0,
                  color: 'transparent',
                  cursor: 'pointer',
                  height: 'auto',
                  left: 0,
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  width: 'auto',
                },
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
            <Flex align="flex-start" gap={1} mt={2}>
              {deadlineOptions.map((option) => (
                <Tag
                  key={option.label}
                  px={3}
                  color="green.500"
                  fontSize={'11px'}
                  bg="green.100"
                  opacity={'100%'}
                  borderRadius={'full'}
                  cursor="pointer"
                  onClick={() => handleDeadlineSelection(option.value)}
                  size={'sm'}
                  variant="subtle"
                >
                  {option.label}
                </Tag>
              ))}
            </Flex>

            <FormErrorMessage>
              {/* {errors.deadline ? <>{errors.deadline.message}</> : <></>} */}
            </FormErrorMessage>
          </FormControl>
        )}
        {isProject && (
          <FormControl
            w="full"
            mb={5}
            isInvalid={errorState.timeToComplete}
            isRequired={isProject}
          >
            <Flex>
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                Estimated Time to Complete
              </FormLabel>
            </Flex>

            <Select
              _placeholder={{
                color: 'brand.slate.300',
              }}
              onChange={(e) => {
                setbountyBasic({
                  ...(bountyBasic as BountyBasicType),
                  timeToComplete: e.target.value,
                });
              }}
              placeholder="Select time to complete"
              value={bountyBasic?.timeToComplete || ''}
            >
              {timeToCompleteOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormControl>
        )}
        <FormControl w="full" mb={5}>
          <Flex>
            <FormLabel
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
            >
              Referred By
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
              label={`Who referred you to add this listing on Superteam Earn?`}
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
              setReferredBy?.(e.target.value);
            }}
            placeholder="Select"
            value={referredBy}
          >
            {Superteams.map((st) => (
              <option value={st.name} key={st.name}>
                {st.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl alignItems="center" gap={3} display="flex">
          <Flex>
            <FormLabel
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
            >
              Private Listing
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
              label={
                'Private listings are only accessible through direct links and do not appear on the Superteam Earn homepage or other public pages on the website.'
              }
              placement="right-end"
            >
              <Image
                mt={-2}
                alt={'Info Icon'}
                src={'/assets/icons/info-icon.svg'}
              />
            </Tooltip>
          </Flex>
          <Switch
            mb={2}
            id="email-alerts"
            isChecked={isPrivate}
            onChange={() => setIsPrivate(!isPrivate)}
          />
        </FormControl>
        <VStack gap={4} w={'full'} mt={6}>
          <Button
            w="100%"
            onClick={() => {
              setErrorState({
                deadline: !bountyBasic?.deadline,
                skills: skills.length === 0,
                subSkills: subSkills.length === 0,
                title: !bountyBasic?.title,
                pocSocials: !bountyBasic?.pocSocials,
                timeToComplete: isProject ? !isTimeToCompleteValid : false,
              });
              if (isProject && !isTimeToCompleteValid) {
                return;
              }

              if (type === 'hackathon' && hasBasicInfo) {
                setSteps(3);
              }

              if (hasBasicInfo && bountyBasic?.deadline) {
                setSteps(3);
              }
              if (isProject && hasBasicInfo && bountyBasic?.timeToComplete) {
                if (
                  bountyBasic?.applicationType === 'rolling' &&
                  !bountyBasic?.deadline
                ) {
                  setbountyBasic({
                    ...(bountyBasic as BountyBasicType),
                    deadline: thirtyDaysFromNow,
                  });
                  setSteps(3);
                }
              }
            }}
            variant="solid"
          >
            Continue
          </Button>
          <Button
            w="100%"
            isDisabled={!bountyBasic?.title}
            isLoading={draftLoading}
            onClick={() => {
              createDraft();
            }}
            variant="outline"
          >
            {isNewOrDraft || isDuplicating ? 'Save Draft' : 'Update Listing'}
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
