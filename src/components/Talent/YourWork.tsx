import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Tooltip,
} from '@chakra-ui/react';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import { SkillSelect } from '@/components/misc/SkillSelectTalent';
import {
  CommunityList,
  IndustryList,
  type MultiSelectOptions,
  web3Exp,
  workExp,
  workType,
} from '@/constants';
import { SkillList, type SubSkillsType } from '@/interface/skills';

import type { UserStoreType } from './types';

type Step1Props = {
  setStep: Dispatch<SetStateAction<number>>;
  useFormStore: () => UserStoreType;
};

export function YourWork({ setStep, useFormStore }: Step1Props) {
  const animatedComponents = makeAnimated();

  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);

  const [DropDownValues, setDropDownValues] = useState({
    community: '',
    interests: '',
  });

  const { updateState } = useFormStore();
  const { form } = useFormStore();

  const [post, setPost] = useState(false);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      experience: form.experience,
      cryptoExperience: form.cryptoExperience,
      currentEmployer: form.currentEmployer,
      community: form.community,
      workPrefernce: form.workPrefernce,
      private: form.private || false,
    },
  });

  const onSubmit = (data: any) => {
    setPost(true);
    if (
      skills.length === 0 ||
      subSkills.length === 0 ||
      DropDownValues.interests.length === 0 ||
      DropDownValues.community.length === 0
    ) {
      return false;
    }
    updateState({
      ...data,
      skills: skills.map((mainskill) => {
        const main = SkillList.find(
          (skill) => skill.mainskill === mainskill.value,
        );
        const sub: SubSkillsType[] = [];

        subSkills.forEach((subskill) => {
          if (
            main &&
            main.subskills.includes(subskill.value as SubSkillsType)
          ) {
            sub.push(subskill.value as SubSkillsType);
          }
        });

        return {
          skills: main?.mainskill ?? '',
          subskills: sub ?? [],
        };
      }),
      subSkills: JSON.stringify(subSkills.map((ele) => ele.value)),
      ...DropDownValues,
    });
    setStep((i) => i + 1);
    return true;
  };

  return (
    <Box w={'full'}>
      <form style={{ width: '100%' }} onSubmit={handleSubmit(onSubmit)}>
        <FormControl w="full" mb={5} isRequired>
          <Flex
            direction={'column'}
            gap={'1.25rem'}
            w={'full'}
            mb={'1.25rem'}
            outline={'0.3125rem'}
          >
            <Box w={'full'}>
              <FormLabel color={'brand.slate.500'}>
                How familiar are you with Web3?
              </FormLabel>

              <Select
                color={
                  watch().cryptoExperience.length === 0 ? 'brand.slate.300' : ''
                }
                borderColor="brand.slate.300"
                _placeholder={{
                  color: 'brand.slate.400',
                }}
                focusBorderColor="brand.purple"
                id="cryptoExperience"
                placeholder="Pick your Experience"
                {...register('cryptoExperience', { required: true })}
              >
                {web3Exp.map((ct) => {
                  return (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  );
                })}
              </Select>
            </Box>
            <Box w={'full'}>
              <FormLabel color={'brand.slate.500'}>Work Experience</FormLabel>
              <Select
                color={watch().experience.length === 0 ? 'brand.slate.300' : ''}
                borderColor="brand.slate.300"
                _placeholder={{
                  color: 'brand.slate.400',
                }}
                focusBorderColor="brand.purple"
                id="experience"
                placeholder="Pick your experience"
                {...register('experience', { required: true })}
              >
                {workExp.map((ct) => {
                  return (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  );
                })}
              </Select>
            </Box>
          </Flex>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>Work Preference</FormLabel>
            <Select
              color={
                watch().workPrefernce.length === 0 ? 'brand.slate.300' : ''
              }
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.400',
              }}
              focusBorderColor="brand.purple"
              id="workPrefernce"
              placeholder="Type of work"
              {...register('workPrefernce', { required: true })}
            >
              {workType.map((ct) => {
                return (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                );
              })}
            </Select>
          </Box>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>Current Employer</FormLabel>
            <Input
              color={'gray.800'}
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.400',
              }}
              focusBorderColor="brand.purple"
              id="currentEmployer"
              placeholder="Current Employer"
              {...register('currentEmployer', { required: true })}
            />
          </Box>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>
              Community Affiliations
            </FormLabel>
            <ReactSelect
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              options={CommunityList.map((elm: string) => {
                return { label: elm, value: elm };
              })}
              required
              onChange={(e: any) => {
                setDropDownValues((st) => {
                  return {
                    ...st,
                    community: JSON.stringify(
                      e.map(
                        (elm: { label: string; value: string }) => elm.value,
                      ),
                    ),
                  };
                });
              }}
              styles={{
                control: (baseStyles) => ({
                  ...baseStyles,
                  border:
                    DropDownValues.community.length === 0 && post
                      ? '2px solid red'
                      : baseStyles.border,
                  backgroundColor: 'brand.slate.500',
                  borderColor: 'brand.slate.300',
                }),
              }}
            />
          </Box>
          <Box w={'full'} mb={'1.25rem'}>
            <FormLabel color={'brand.slate.500'}>
              What areas of Web3 are you most interested in?
            </FormLabel>
            <ReactSelect
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              options={IndustryList}
              required
              onChange={(e: any) => {
                setDropDownValues((st) => {
                  return {
                    ...st,
                    interests: JSON.stringify(
                      e.map(
                        (elm: { label: string; value: string }) => elm.value,
                      ),
                    ),
                  };
                });
              }}
              styles={{
                control: (baseStyles) => ({
                  ...baseStyles,
                  border:
                    DropDownValues.interests.length === 0 && post
                      ? '2px solid red'
                      : baseStyles.border,
                  backgroundColor: 'brand.slate.500',
                  borderColor: 'brand.slate.300',
                }),
              }}
            />
          </Box>
          <SkillSelect
            errorSkill={post && skills.length === 0}
            errorSubSkill={post && subSkills.length === 0}
            skills={skills}
            subSkills={subSkills}
            setSkills={setSkills}
            setSubSkills={setSubSkills}
            helperText="We will send email notifications of new listings for your selected skills"
          />
          <Flex align={'center'} mb={'2.5rem'}>
            <FormControl>
              <Checkbox
                mr={1}
                color="brand.slate.500"
                fontWeight={500}
                colorScheme="purple"
                size="md"
                {...register('private')}
              >
                Keep my info private
              </Checkbox>
            </FormControl>
            <Tooltip
              w="max"
              p="0.7rem"
              color="white"
              fontSize="xs"
              fontWeight={400}
              bg="#6562FF"
              borderRadius="0.5rem"
              hasArrow
              label={`Your "Work Preference" information will be hidden from your public talent profile. However, you will continue to receive updates about new opportunities on your email.`}
              placement="right-end"
            >
              <InfoOutlineIcon color="brand.slate.500" />
            </Tooltip>
          </Flex>
          <Button
            w={'full'}
            h="50px"
            color={'white'}
            bg={'rgb(101, 98, 255)'}
            type="submit"
          >
            Continue
          </Button>
        </FormControl>
      </form>
    </Box>
  );
}
