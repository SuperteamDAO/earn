import React from 'react';
import { type Control, type FieldValues, type Path } from 'react-hook-form';

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

// Children are input-like elements that receive the field's props.
type InputLikeProps = React.InputHTMLAttributes<HTMLInputElement>;

interface FormFieldWrapperProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  isRequired?: boolean;
  children?: React.ReactNode;
  isRichEditor?: boolean;
  isTokenInput?: boolean;
  token?: string | null;
  richEditorPlaceholder?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPro?: boolean;
}

export function FormFieldWrapper<T extends FieldValues>({
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
  isPro = false,
}: FormFieldWrapperProps<T>) {
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
                  onChange={(e) => field.onChange(e)}
                  error={false}
                  placeholder={richEditorPlaceholder}
                  isPro={isPro}
                />
              ) : isTokenInput ? (
                <TokenInput
                  token={token}
                  value={field.value}
                  onChange={(e) => field.onChange(e)}
                  isPro={isPro}
                />
              ) : (
                React.cloneElement(
                  children as React.ReactElement<InputLikeProps>,
                  {
                    ...field,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      field.onChange(e);
                      onChange?.(e);
                    },
                    className: cn(
                      (children as React.ReactElement<InputLikeProps>).props
                        ?.className,
                      isPro && 'focus-visible:ring-zinc-400',
                    ),
                  },
                )
              )}
            </FormControl>
            <FormMessage className="pt-1" />
          </div>
        </FormItem>
      )}
    />
  );
}
