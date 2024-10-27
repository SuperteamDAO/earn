import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
} from '@chakra-ui/react';
import React from 'react';
import { type Control, useController } from 'react-hook-form';

import { RichEditor } from '../shared/RichEditor';

interface RichTextInputWithHelperProps {
  id: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  control: Control<any>;
  validate?: (value: string) => boolean | string;
  defaultValue?: string;
  isRequired?: boolean;
  h?: string;
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
  h = 'auto',
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
        console.log('validate', validate);
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
        height={h}
      />
      <FormErrorMessage>{error?.message}</FormErrorMessage>
    </FormControl>
  );
};

export default RichTextInputWithHelper;
