import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { type ReactNode } from 'react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type PathValue,
} from 'react-hook-form';

import { RichEditor } from '../shared/RichEditor';

type FieldType = 'text' | 'number' | 'textarea' | 'rich-text';

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  helperText?: ReactNode;
  placeholder?: string;
  type?: FieldType;
  maxLength?: number;
  defaultValue?: PathValue<T, Path<T>>;
  isRequired?: boolean;
  readOnly?: boolean;
  minH?: string;
  h?: string;
  validate?: (value: any) => boolean | string;
}

export const FormField = <T extends FieldValues>({
  name,
  label,
  control,
  helperText,
  placeholder,
  type = 'text',
  maxLength,
  defaultValue = '' as PathValue<T, Path<T>>,
  isRequired,
  readOnly = false,
  minH = 'unset',
  h = 'auto',
  validate,
}: FormFieldProps<T>) => {
  const isTextArea = type === 'textarea';
  const isRichText = type === 'rich-text';

  const renderField = (field: any, error: any) => {
    if (isRichText) {
      return (
        <RichEditor
          id={name}
          value={field.value}
          onChange={field.onChange}
          placeholder={placeholder}
          isError={!!error}
          height={h}
        />
      );
    }

    const Component = isTextArea ? Textarea : Input;
    return (
      <Component
        {...field}
        id={name}
        borderColor="brand.slate.300"
        _placeholder={{ color: 'brand.slate.300' }}
        focusBorderColor="brand.purple"
        placeholder={placeholder}
        isReadOnly={readOnly}
        isDisabled={readOnly}
        type={type !== 'textarea' ? type : undefined}
        {...(isTextArea && { minH })}
        {...(maxLength && {
          maxLength,
          onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => {
            if (e.target.value.length <= maxLength) {
              field.onChange(e);
            }
          },
        })}
      />
    );
  };

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      rules={{
        validate: (value) => {
          if (isRequired) {
            if (!value) return 'This field is required';
            if (
              isRichText &&
              (value.trim() === '' || value.trim() === '<p></p>')
            ) {
              return 'This field is required';
            }
          }
          return validate ? validate(value) : true;
        },
        ...(maxLength && { maxLength }),
      }}
      render={({ field, fieldState: { error } }) => {
        const charCount = field.value?.length || 0;
        const isNearLimit = maxLength && charCount > maxLength - 30;
        const isAtLimit = maxLength && charCount === maxLength;

        return (
          <FormControl isInvalid={!!error} isRequired={isRequired}>
            <FormLabel
              mb={0}
              color="brand.slate.600"
              fontWeight="semibold"
              htmlFor={name}
            >
              {label}
            </FormLabel>

            {helperText && (
              <FormHelperText mt={0} mb={2} color="brand.slate.500">
                {helperText}
              </FormHelperText>
            )}

            {renderField(field, error)}

            <Box minH="20px">
              {error ? (
                <FormErrorMessage mt={1}>
                  {error.message as string}
                </FormErrorMessage>
              ) : (
                !isRichText &&
                isNearLimit && (
                  <Text
                    mt={1}
                    color={isAtLimit ? 'red.500' : 'brand.slate.500'}
                    fontSize="xs"
                    textAlign="right"
                  >
                    {isAtLimit
                      ? 'Character limit reached'
                      : `${maxLength - charCount} characters remaining`}
                  </Text>
                )
              )}
            </Box>
          </FormControl>
        );
      }}
    />
  );
};
