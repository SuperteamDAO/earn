import React from 'react';

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
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
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
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
};
