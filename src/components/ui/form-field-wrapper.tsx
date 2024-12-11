import React from 'react';

import { cn } from '@/utils';

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
                  onChange={field.onChange}
                  error={false}
                  placeholder={richEditorPlaceholder}
                />
              ) : isTokenInput ? (
                <TokenInput
                  token={token}
                  value={field.value}
                  onChange={field.onChange}
                />
              ) : (
                React.cloneElement(children as React.ReactElement, { ...field })
              )}
            </FormControl>
            <FormMessage className="pt-1" />
          </div>
        </FormItem>
      )}
    />
  );
};
