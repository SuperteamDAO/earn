import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';
import { type ReactElement } from 'react';

import { AutoResizeTextarea } from '../shared/autosize-textarea';

interface TextAreaWithCounterProps {
  id: string;
  label: string;
  helperText: string;
  placeholder: string;
  register: any;
  validate?: any;
  watch: any;
  maxLength?: number;
  errors: any;
  isRequired?: boolean;
  minH?: string;
}

interface TextInputWithHelperProps {
  id: string;
  label: string;
  helperText: ReactElement | string;
  placeholder: string;
  register: any;
  errors: any;
  validate?: any;
  defaultValue?: string;
  type?: string;
  isRequired?: boolean;
  readOnly?: boolean;
}

export const TextAreaWithCounter = ({
  id,
  label,
  helperText,
  placeholder,
  register,
  validate,
  watch,
  maxLength = 2000,
  errors,
  isRequired,
  minH = 'unset',
}: TextAreaWithCounterProps) => (
  <FormControl isRequired={isRequired}>
    <FormLabel mb={0} color={'brand.slate.600'} fontWeight={600} htmlFor={id}>
      {label}
    </FormLabel>
    <FormHelperText mt={0} mb={2} color="brand.slate.500">
      {helperText}
    </FormHelperText>
    <AutoResizeTextarea
      borderColor={'brand.slate.300'}
      _placeholder={{ color: 'brand.slate.300' }}
      focusBorderColor="brand.purple"
      id={id}
      placeholder={placeholder}
      {...register(id, { validate })}
      maxLength={maxLength}
      minH={minH}
    />
    <Text
      color={
        (watch(id)?.length || 0) > maxLength - 30 ? 'red' : 'brand.slate.400'
      }
      fontSize={'xs'}
      textAlign="right"
    >
      {watch(id)?.length > maxLength - 80 &&
        (maxLength - (watch(id)?.length || 0) === 0 ? (
          <p>字符数已达上限</p>
        ) : (
          <p>还剩 {maxLength - (watch(id)?.length || 0)}</p>
        ))}
    </Text>
    <FormErrorMessage>
      {errors[id] ? <>{errors[id].message}</> : <></>}
    </FormErrorMessage>
  </FormControl>
);

export const TextInputWithHelper = ({
  id,
  label,
  helperText,
  placeholder,
  register,
  errors,
  validate,
  defaultValue,
  type = 'text',
  isRequired,
  readOnly = false,
}: TextInputWithHelperProps) => (
  <FormControl isRequired={isRequired}>
    <FormLabel mb={0} color={'brand.slate.600'} fontWeight={600} htmlFor={id}>
      {label}
    </FormLabel>
    <FormHelperText mt={0} mb={2} color="brand.slate.500">
      {helperText}
    </FormHelperText>
    <Input
      borderColor={'brand.slate.300'}
      _placeholder={{ color: 'brand.slate.300' }}
      focusBorderColor="brand.purple"
      id={id}
      isDisabled={readOnly}
      placeholder={placeholder}
      readOnly={readOnly}
      {...register(id, { validate })}
      defaultValue={defaultValue}
      type={type}
    />
    <FormErrorMessage>{errors[id] && errors[id].message}</FormErrorMessage>
  </FormControl>
);
