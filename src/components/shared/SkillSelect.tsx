import { Info } from 'lucide-react';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type MultiSelectOptions } from '@/constants';
import { MainSkills, skillSubSkillMap } from '@/interface/skills';

function removeDuplicates(arr: MultiSelectOptions[]): MultiSelectOptions[] {
  return Array.from(
    arr
      .reduce((map, item) => {
        if (!map.has(item.value)) {
          map.set(item.value, item);
        }
        return map;
      }, new Map<string, MultiSelectOptions>())
      .values(),
  );
}

interface Props {
  skills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  errorSkill?: boolean;
  errorSubSkill?: boolean;
  skillLabel?: string;
  subSkillLabel?: string;
  helperText?: string;
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
  helperText,
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

  const selectStyles = {
    control: (baseStyles: any, state: { isFocused: boolean }) => ({
      ...baseStyles,
      border: state.isFocused
        ? '2px solid rgb(147 51 234)'
        : errorSkill
          ? '2px solid red'
          : '1px solid rgb(203 213 225)',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: state.isFocused ? 'rgb(147 51 234)' : 'rgb(203 213 225)',
      },
    }),
  };

  return (
    <>
      <FormItem className="mb-5">
        <div className="flex items-center justify-start">
          <FormLabel className="font-medium text-slate-500" htmlFor="skills">
            {skillLabel}
          </FormLabel>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="-ml-2 mb-3 h-3 w-3 text-slate-500" />
              </TooltipTrigger>
              <TooltipContent className="rounded-lg bg-brand-purple px-3 py-2 text-sm font-medium text-white">
                Select all that apply
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {helperText && (
          <FormDescription className="mb-3 ml-0.5 mt-[-8px] text-[13px] text-slate-400">
            {helperText}
          </FormDescription>
        )}

        <FormControl>
          <ReactSelect
            styles={selectStyles}
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            value={skills}
            required
            options={MainSkills}
            onChange={(e) => {
              handleChange(e as any);
              setSkills(e as any);
            }}
          />
        </FormControl>
      </FormItem>

      <FormItem className="mb-5">
        <div className="flex items-center justify-start">
          <FormLabel className="font-medium text-slate-500" htmlFor="subskills">
            {subSkillLabel}
          </FormLabel>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="-ml-2 mb-3 h-3 w-3 text-slate-500" />
              </TooltipTrigger>
              <TooltipContent className="rounded-lg bg-brand-purple px-3 py-2 text-sm font-medium text-white">
                Select all that apply
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <FormControl>
          <ReactSelect
            styles={{
              ...selectStyles,
              control: (baseStyles) => ({
                ...baseStyles,
                border: errorSubSkill ? '2px solid red' : baseStyles.border,
              }),
            }}
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            value={subSkills}
            required
            options={removeDuplicates(subSkillOptions)}
            onChange={(e) => {
              setSubSkills(e as any);
            }}
          />
        </FormControl>
      </FormItem>
    </>
  );
};
