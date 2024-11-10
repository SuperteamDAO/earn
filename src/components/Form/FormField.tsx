import { type ReactNode } from 'react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type PathValue,
} from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils';

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

export const CustomFormField = <T extends FieldValues>({
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
          error={!!error}
          height={h}
        />
      );
    }

    if (isTextArea) {
      return (
        <Textarea
          {...field}
          id={name}
          placeholder={placeholder}
          disabled={readOnly}
          className={cn(
            'min-h-[unset]',
            minH !== 'unset' && `min-h-[${minH}]`,
            readOnly && 'cursor-not-allowed opacity-50',
          )}
          onChange={(e) => {
            if (!maxLength || e.target.value.length <= maxLength) {
              field.onChange(e);
            }
          }}
        />
      );
    }

    return (
      <Input
        {...field}
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={readOnly}
        className={cn(readOnly && 'cursor-not-allowed opacity-50')}
        onChange={(e) => {
          if (!maxLength || e.target.value.length <= maxLength) {
            field.onChange(e);
          }
        }}
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
          <FormItem>
            <FormLabel
              className={cn(
                'mb-0 font-semibold text-slate-600',
                isRequired &&
                  'after:ml-0.5 after:text-destructive after:content-["*"]',
              )}
            >
              {label}
            </FormLabel>

            {helperText && (
              <FormDescription className="mb-2 mt-0 text-slate-500">
                {helperText}
              </FormDescription>
            )}

            <FormControl>{renderField(field, error)}</FormControl>

            <div className="min-h-[20px]">
              {error ? (
                <FormMessage className="mt-1">{error.message}</FormMessage>
              ) : (
                !isRichText &&
                isNearLimit && (
                  <p
                    className={cn(
                      'mt-1 text-right text-xs',
                      isAtLimit ? 'text-destructive' : 'text-slate-500',
                    )}
                  >
                    {isAtLimit
                      ? 'Character limit reached'
                      : `${maxLength - charCount} characters remaining`}
                  </p>
                )
              )}
            </div>
          </FormItem>
        );
      }}
    />
  );
};
