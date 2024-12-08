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

interface Props {
  skills: MultiSelectOptions[];
  subSkills: MultiSelectOptions[];
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  skillLabel?: string;
  subSkillsLabel?: string;
  errorSkill?: boolean;
  errorSubSkill?: boolean;
  helperText?: string;
}

export const SkillSelect = ({
  skills,
  subSkills,
  errorSkill,
  errorSubSkill,
  setSkills,
  setSubSkills,
  helperText,
}: Props) => {
  const animatedComponents = makeAnimated();
  const [subSkillOptions, setSubSkillOptions] = useState<MultiSelectOptions[]>(
    [],
  );

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
      <FormItem className="my-6">
        <div className="flex items-center justify-start">
          <FormLabel className="text-slate-500" htmlFor="skills">
            Your Skills
          </FormLabel>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="-ml-2 mb-3 h-3 w-3 text-slate-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-none rounded-lg bg-[#6562FF] px-3 py-2 text-[0.9rem] font-semibold text-white">
                Select all that apply
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {helperText && (
          <FormDescription className="-mt-2 mb-3 ml-0.5 text-[13px] text-slate-400">
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

      <FormItem className="my-6">
        <div className="flex items-center justify-start">
          <FormLabel className="text-slate-500" htmlFor="skills">
            Sub Skills
          </FormLabel>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="-ml-2 mb-3 h-3 w-3 text-slate-500" />
              </TooltipTrigger>
              <TooltipContent className="max-w-none rounded-lg bg-[#6562FF] px-3 py-2 text-[0.9rem] font-semibold text-white">
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
            required
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
      </FormItem>
    </>
  );
};
