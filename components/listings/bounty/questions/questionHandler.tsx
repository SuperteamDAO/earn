import {
  Checkbox,
  FormLabel,
  HStack,
  Input,
  Select,
  Textarea,
} from '@chakra-ui/react';
import {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  UseFormRegister,
  UseFormStateReturn,
} from 'react-hook-form';
import ReactSelect from 'react-select';
import { QuestionType } from './builder';
import makeAnimated from 'react-select/animated';
import { MainSkills, MultiSelectOptions } from '../../../../constants';
import { Controller } from 'react-hook-form';
import { ReactElement, JSXElementConstructor } from 'react';

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
  } else if (type === 'long-text') {
    return (
      <>
        <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
          {question}
        </FormLabel>
        <Textarea {...register(label)} />
      </>
    );
  } else if (type === 'checkbox') {
    return (
      <>
        <HStack justify={'start'} align={'center'}>
          <FormLabel color={'gray.600 !important'} fontSize={'1.1rem'}>
            {question}
          </FormLabel>
          <Checkbox {...register(label)} mt={'-10px !important'} />
        </HStack>
      </>
    );
  } else if (type === 'single-choice') {
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
  } else if (type === 'multi-choice') {
    const animatedComponents = makeAnimated();
    const option: MultiSelectOptions[] = [];
    options.map((e) => {
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
  } else {
    return <></>;
  }
};
