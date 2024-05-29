import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';

import { AutoResizeTextarea } from '../shared/autosize-textarea';

export const TextAreaWithCounter = ({
  id,
  label,
  helperText,
  placeholder,
  register,
  watch,
  maxLength = 2000,
  errors,
}: any) => (
  <FormControl>
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
      {...register(id)}
      maxLength={maxLength}
    />
    <Text
      color={
        (watch(id)?.length || 0) > maxLength - 100 ? 'red' : 'brand.slate.400'
      }
      fontSize={'xs'}
      textAlign="right"
    >
      {watch(id)?.length > maxLength - 200 &&
        (maxLength - (watch(id)?.length || 0) === 0 ? (
          <p>Character limit reached</p>
        ) : (
          <p>{maxLength - (watch(id)?.length || 0)} characters left</p>
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
}: any) => (
  <FormControl isRequired>
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
      placeholder={placeholder}
      {...register(id, { validate })}
      defaultValue={defaultValue}
      type={type}
    />
    <FormErrorMessage>{errors[id] && errors[id].message}</FormErrorMessage>
  </FormControl>
);
