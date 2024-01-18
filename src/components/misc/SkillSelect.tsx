import { Flex, FormControl, FormLabel, Image, Tooltip } from '@chakra-ui/react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import type { MultiSelectOptions } from '../../constants';
import { MainSkills, skillSubSkillMap } from '../../constants';

interface Props {
  skills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  errorSkill?: boolean;
  errorSubSkill?: boolean;
  skillLabel?: string;
  subSkillLabel?: string;
}
export const SkillSelect = ({
  skills,
  subSkills,
  errorSkill,
  errorSubSkill,
  setSkills,
  setSubSkills,
  skillLabel = 'Skills Needed',
  subSkillLabel = 'Sub Skills Needed',
}: Props) => {
  const animatedComponents = makeAnimated();
  const tempSubSkills: MultiSelectOptions[] = [];
  skills.forEach((s) => {
    const subSkillsForSkill =
      skillSubSkillMap[s.value as keyof typeof skillSubSkillMap];
    // check if subSkillsForSkill exists and is an array before spreading
    if (Array.isArray(subSkillsForSkill)) {
      tempSubSkills.push(...subSkillsForSkill);
    }
  });
  const [subSkillOptions, setSubSkillOptions] =
    useState<MultiSelectOptions[]>(tempSubSkills);
  const handleChange = (e: MultiSelectOptions[]) => {
    const sub: MultiSelectOptions[] = [];
    e.forEach((op) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sub.push(...(skillSubSkillMap[op.value as any] as any));
    });
    setSubSkillOptions(sub);
  };
  return (
    <>
      <FormControl mb={5} isRequired>
        <Flex align={'center'} justify={'start'}>
          <FormLabel
            color={'brand.slate.500'}
            fontWeight={500}
            htmlFor={'skills'}
          >
            {skillLabel}
          </FormLabel>
          <Tooltip
            w="max"
            p="0.7rem"
            color="white"
            fontSize="sm"
            fontWeight={500}
            bg="brand.purple"
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
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              border: errorSkill ? '2px solid red' : baseStyles.border,
              backgroundColor: 'brand.slate.500',
              borderColor: state.isFocused ? 'brand.purple' : 'brand.slate.300',
            }),
          }}
          closeMenuOnSelect={false}
          components={animatedComponents}
          isMulti
          value={skills}
          required={true}
          options={MainSkills}
          onChange={(e) => {
            handleChange(e as any);
            setSkills(e as any);
          }}
        />
      </FormControl>
      <FormControl mb={5}>
        <Flex align={'center'} justify={'start'}>
          <FormLabel
            color={'brand.slate.500'}
            fontWeight={500}
            htmlFor={'skills'}
          >
            {subSkillLabel}
          </FormLabel>
          <Tooltip
            w="max"
            p="0.7rem"
            color="white"
            fontSize="sm"
            fontWeight={500}
            bg="brand.purple"
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
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              border: errorSubSkill ? '2px solid red' : baseStyles.border,
              backgroundColor: 'brand.slate.500',
              borderColor: state.isFocused ? 'brand.purple' : 'brand.slate.300',
            }),
          }}
          closeMenuOnSelect={false}
          components={animatedComponents}
          isMulti
          value={subSkills}
          options={subSkillOptions}
          onChange={(e) => {
            setSubSkills(e as any);
          }}
        />
      </FormControl>
    </>
  );
};
