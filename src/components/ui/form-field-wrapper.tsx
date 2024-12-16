import React from 'react';

import { cn } from '@/utils/cn';

import { RichEditor } from '../shared/RichEditor';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { TokenInput } from './token-input';

export const FormFieldWrapper = ({
  control,
  name,
  label,
  description,
  isRequired,
  children,
  isRichEditor = false,
  isTokenInput = false,
  token,
  richEditorPlaceholder,
  className,
  onChange,
}: {
  control: any;
  name: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  isRequired?: boolean;
  children?: React.ReactNode;
  isRichEditor?: boolean;
  isTokenInput?: boolean;
  token?: string;
  richEditorPlaceholder?: string;
  className?: string;
  onChange?: (e: any) => void; // doesnt override, only adds to existing onChange
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex flex-col gap-2', className)}>
          <div>
            {label && <FormLabel isRequired={isRequired}>{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <div>
            <FormControl>
              {isRichEditor ? (
                <RichEditor
                  id={name}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.(e);
                  }}
                  error={false}
                  placeholder={richEditorPlaceholder}
                />
              ) : isTokenInput ? (
                <TokenInput
                  token={token}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.(e);
                  }}
                />
              ) : (
                React.cloneElement(children as React.ReactElement, {
                  ...field,
                  onChange: (e: any) => {
                    field.onChange(e);
                    onChange?.(e);
                  },
                })
              )}
            </FormControl>
            <FormMessage className="pt-1" />
          </div>
        </FormItem>
      )}
    />
  );
};
