import {
  Checkbox,
  FormLabel,
  HStack,
  Input,
  Select,
  Textarea,
} from '@chakra-ui/react';
import type { Control, FieldValues, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import type { MultiSelectOptions } from '../../../../constants';
import type { QuestionType } from './builder';

interface Props {
  question: string;
  index: string;
  type: QuestionType;
  options: string[];
  label: string;
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues, any>;
}
export const QuestionHandler = ({
  index,
  question,
  type,
  options,
  register,
  label,
  control,
}: Props) => {
  if (type === 'text') {
    return (
      <>
        <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
          {question}
        </FormLabel>
        <Input {...register(label)} />
      </>
    );
  }
  if (type === 'long-text') {
    return (
      <>
        <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
          {question}
        </FormLabel>
        <Textarea {...register(label)} />
      </>
    );
  }
  if (type === 'checkbox') {
    return (
      <>
        <HStack align={'center'} justify={'start'}>
          <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
            {question}
          </FormLabel>
          <Checkbox {...register(label)} mt={'-6px !important'} />
        </HStack>
      </>
    );
  }
  if (type === 'single-choice') {
    return (
      <>
        <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
          {question}
        </FormLabel>
        <Select {...register(label)}>
          {options.map((e) => {
            return (
              <option key={index} value={e}>
                {e}
              </option>
            );
          })}
        </Select>
      </>
    );
  }
  if (type === 'multi-choice') {
    const animatedComponents = makeAnimated();
    const option: MultiSelectOptions[] = [];
    options.forEach((e) => {
      option.push({ value: e, label: e });
    });
    return (
      <>
        <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
          {question}
        </FormLabel>
        <Controller
          control={control}
          render={({ field }) => {
            return (
              <ReactSelect
                closeMenuOnSelect={false}
                components={animatedComponents}
                isMulti
                required={true}
                options={option}
                {...field}
              />
            );
          }}
          name={'multi-choice'}
        ></Controller>
      </>
    );
  }
  return <></>;
};
