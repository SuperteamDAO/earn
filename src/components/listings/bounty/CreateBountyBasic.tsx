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
import { Regions } from '@prisma/client';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import { SkillSelect } from '@/components/misc/SkillSelect';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';
import { isValidHttpUrl } from '@/utils/validUrl';

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
  regions: Regions;
  setRegions: Dispatch<SetStateAction<Regions>>;
  type: 'open' | 'permissioned';
  timeToComplete?: string;
}
interface ErrorsBasic {
  title: boolean;
  deadline: boolean;
  skills: boolean;
  subSkills: boolean;
  pocSocials: boolean;
  applicationType: boolean;
  timeToComplete: boolean;
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
  regions,
  setRegions,
  type,
}: Props) => {
  const { userInfo } = userStore();

  const [errorState, setErrorState] = useState<ErrorsBasic>({
    deadline: false,
    title: false,
    subSkills: false,
    skills: false,
    pocSocials: false,
    applicationType: false,
    timeToComplete: false,
  });

  const [isUrlValid, setIsUrlValid] = useState(true);

  const date = dayjs().format('YYYY-MM-DD');
  const thirtyDaysFromNow = dayjs().add(30, 'day').format('YYYY-MM-DDTHH:mm');

  const hasBasicInfo =
    bountyBasic?.title &&
    skills.length !== 0 &&
    subSkills.length !== 0 &&
    bountyBasic?.pocSocials &&
    isUrlValid;

  return (
    <>
      <VStack align={'start'} gap={3} w={'2xl'} pt={7} pb={12}>
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
        {userInfo?.role === 'GOD' && (
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
                <option value={Regions.INDIA}>India</option>
                <option value={Regions.GERMANY}>Germany</option>
                <option value={Regions.MEXICO}>Mexico</option>
                <option value={Regions.TURKEY}>Turkey</option>
                <option value={Regions.VIETNAM}>Vietnam</option>
                <option value={Regions.UK}>UK</option>
                <option value={Regions.UAE}>UAE</option>
                <option value={Regions.NIGERIA}>Nigeria</option>
                <option value={Regions.ISRAEL}>Israel</option>
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
            onBlur={(e) => {
              const url = e.target.value;
              setIsUrlValid(isValidHttpUrl(url));
            }}
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
        {type === 'permissioned' && (
          <FormControl
            w="full"
            mb={5}
            isInvalid={errorState.applicationType}
            isRequired={type === 'permissioned'}
          >
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
        {bountyBasic?.applicationType !== 'rolling' && (
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
        )}
        {type === 'permissioned' && (
          <FormControl
            w="full"
            mb={5}
            isInvalid={errorState.timeToComplete}
            isRequired={type === 'permissioned'}
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
              value={bountyBasic?.timeToComplete}
            >
              <option value="1-2 weeks">1-2 weeks</option>
              <option value="2-4 weeks">2-4 weeks</option>
              <option value="1-2 months">1-2 months</option>
            </Select>
          </FormControl>
        )}
        <VStack gap={4} w={'full'} pt={10}>
          <Button
            w="100%"
            onClick={() => {
              setErrorState({
                deadline:
                  bountyBasic?.applicationType === 'fixed'
                    ? !bountyBasic?.deadline
                    : false,
                skills: skills.length === 0,
                subSkills: subSkills.length === 0,
                title: !bountyBasic?.title,
                pocSocials: !bountyBasic?.pocSocials,
                applicationType: !bountyBasic?.applicationType,
                timeToComplete:
                  type === 'permissioned'
                    ? !bountyBasic?.timeToComplete
                    : false,
              });

              if (hasBasicInfo && bountyBasic?.deadline) {
                setSteps(3);
              }
              if (
                type === 'permissioned' &&
                hasBasicInfo &&
                bountyBasic?.timeToComplete
              ) {
                if (
                  bountyBasic?.applicationType === 'rolling' &&
                  !bountyBasic?.deadline
                ) {
                  setbountyBasic({
                    ...(bountyBasic as BountyBasicType),
                    deadline: thirtyDaysFromNow,
                  });
                }
                setSteps(3);
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
            Save as Draft
          </Button>
        </VStack>
      </VStack>
    </>
  );
};
