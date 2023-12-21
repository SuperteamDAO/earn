import {
  Checkbox,
  FormLabel,
  HStack,
  Select,
  Text,
  Textarea,
} from '@chakra-ui/react';
import type { Control, FieldValues, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';

import { AutoResizeTextarea } from '@/components/shared/autosize-textarea';

import type { MultiSelectOptions } from '../../../../constants';
import type { QuestionType } from './builder';

interface Props {
  question: string;
  type: QuestionType;
  options?: string[];
  label: string;
  register: UseFormRegister<FieldValues>;
  control?: Control<FieldValues, any>;
  watch?: any;
}
export const QuestionHandler = ({
  question,
  type,
  options,
  register,
  label,
  control,
  watch,
}: Props) => {
  if (type === 'text') {
    return (
      <>
        <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
          {question}
        </FormLabel>
        <AutoResizeTextarea
          borderColor={'brand.slate.300'}
          _placeholder={{ color: 'brand.slate.300' }}
          focusBorderColor="brand.purple"
          maxLength={3000}
          {...register(label)}
        />
        <Text
          color={(watch(label)?.length || 0) > 2900 ? 'red' : 'brand.slate.400'}
          fontSize={'xs'}
          textAlign="right"
        >
          {watch(label)?.length > 2500 &&
            (3000 - (watch(label)?.length || 0) === 0 ? (
              <p>Character limit reached</p>
            ) : (
              <p>{3000 - (watch(label)?.length || 0)} characters left</p>
            ))}
        </Text>
      </>
    );
  }
  if (type === 'long-text') {
    return (
      <>
        <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
          {question}
        </FormLabel>
        <Textarea
          borderColor={'brand.slate.300'}
          _placeholder={{ color: 'brand.slate.300' }}
          focusBorderColor="brand.purple"
          {...register(label)}
        />
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
          {options?.map((e, eIndex) => {
            return (
              <option key={eIndex} value={e}>
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
    options?.forEach((e) => {
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
