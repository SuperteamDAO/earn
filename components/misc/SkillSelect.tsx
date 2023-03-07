import { Flex, FormControl, FormLabel, Image, Tooltip } from '@chakra-ui/react';
import React, { Dispatch, SetStateAction, useState } from 'react';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';
import {
  MainSkills,
  MultiSelectOptions,
  skillSubSkillMap,
} from '../../constants';

interface Props {
  skills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  errorSkill?: boolean;
  errorSubSkill?: boolean;
}
export const SkillSelect = ({
  skills,
  subSkills,
  errorSkill,
  errorSubSkill,
  setSkills,
  setSubSkills,
}: Props) => {
  const animatedComponents = makeAnimated();
  const [subSkillOptions, setSubSkillOptions] = useState<MultiSelectOptions[]>(
    []
  );
  const handleChange = (e: MultiSelectOptions[]) => {
    let sub: MultiSelectOptions[] = [];
    e.map((op) => {
      //@ts-ignore
      sub.push(...(skillSubSkillMap[op.value as any] as any));
    });
    setSubSkillOptions(sub);
  };
  return (
    <>
      <FormControl my={6} isRequired>
        <Flex align={'center'} justify={'start'}>
          <FormLabel
            color={'gray.500'}
            fontWeight={600}
            fontSize={'15px'}
            htmlFor={'skills'}
          >
            Skills Needed
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
            label={`Select all that apply`}
          >
            <Image
              mt={-2}
              src={'/assets/icons/info-icon.svg'}
              alt={'Info Icon'}
            />
          </Tooltip>
        </Flex>
        <ReactSelect
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              border: errorSkill ? '2px solid red' : baseStyles.border,
            }),
          }}
          closeMenuOnSelect={false}
          components={animatedComponents}
          isMulti
          value={skills}
          required={true}
          options={MainSkills}
          onChange={(e) => {
            console.log(e);
            handleChange(e as any);
            setSkills(e as any);
          }}
        />
      </FormControl>
      <FormControl my={6}>
        <Flex align={'center'} justify={'start'}>
          <FormLabel
            color={'gray.500'}
            fontWeight={600}
            fontSize={'15px'}
            htmlFor={'skills'}
          >
            Sub Skills Needed
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
            label={`Select all that apply`}
          >
            <Image
              mt={-2}
              src={'/assets/icons/info-icon.svg'}
              alt={'Info Icon'}
            />
          </Tooltip>
        </Flex>
        <ReactSelect
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              border: errorSubSkill ? '2px solid red' : baseStyles.border,
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
