import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
} from '@chakra-ui/react';
import React from 'react';
import { type Control, type FieldValues, useController } from 'react-hook-form';

import { RichEditor } from '../shared/RichEditor';

interface RichTextInputWithHelperProps {
  id: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  control: Control<FieldValues>;
  validate?: (value: string) => boolean | string;
  defaultValue?: string;
  isRequired?: boolean;
}

const RichTextInputWithHelper: React.FC<RichTextInputWithHelperProps> = ({
  id,
  label,
  helperText,
  placeholder,
  control,
  validate,
  defaultValue,
  isRequired,
}) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: id,
    control,
    defaultValue: defaultValue || '',
    rules: {
      validate: (value) => {
        if (
          isRequired &&
          (!value || value.trim() === '' || value.trim() === '<p></p>')
        ) {
          return 'This field is required';
        }
        return validate ? validate(value) : true;
      },
    },
  });

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired}>
      <FormLabel mb={0} color={'brand.slate.600'} fontWeight={600} htmlFor={id}>
        {label}
      </FormLabel>
      <FormHelperText mt={0} mb={2} color="brand.slate.500">
        {helperText}
      </FormHelperText>
      <RichEditor
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isError={!!error}
      />
      <FormErrorMessage>{error?.message}</FormErrorMessage>
    </FormControl>
  );
};

export default RichTextInputWithHelper;
