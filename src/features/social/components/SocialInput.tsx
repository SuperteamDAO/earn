import React from 'react';
import { type Control } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

import {
  extractSocialUsername,
  linkedUsernames,
  lowercaseOnly,
  removeAtSign,
  socials,
} from '../utils';

type SocialInputProps = {
  control: Control<any>;
};

export const SocialInput = ({ control }: SocialInputProps) => {
  const getDisplayValue = (name: string, value: string) => {
    const social = socials.find((s) => s.name === name);
    if (social?.prefix && value?.startsWith(social.prefix)) {
      return value.slice(social.prefix.length);
    }
    return value;
  };

  return (
    <>
      {socials.map(({ name, label, placeholder, icon: Icon, required }) => {
        return (
          <div className="mb-5" key={name}>
            <FormField
              control={control}
              name={name}
              render={({ field }) => {
                const displayValue = getDisplayValue(name, field.value);
                return (
                  <FormItem>
                    <div className="flex items-center justify-center">
                      <FormLabel className="relative">
                        <span className="sr-only">{name}</span>
                        <Icon className="mr-3 h-5 w-5 text-slate-600" />
                        {required && (
                          <span className="absolute -top-1 right-1 font-medium text-red-500">
                            *
                          </span>
                        )}
                      </FormLabel>

                      {label && (
                        <div className="flex h-[2.6875rem] items-center justify-center rounded-l-md border border-r-0 border-slate-300 px-3 text-xs font-medium text-slate-600 shadow-sm md:justify-start md:text-sm">
                          {label}
                        </div>
                      )}

                      <FormControl>
                        <Input
                          {...field}
                          className={cn(
                            'h-[2.6875rem] w-full',
                            label ? 'rounded-l-none' : 'rounded-md',
                          )}
                          placeholder={placeholder}
                          value={displayValue}
                          onChange={(e) => {
                            const value = e.currentTarget.value;
                            const linkedUsernameValue =
                              linkedUsernames.safeParse(name);
                            if (linkedUsernameValue.data) {
                              const extractedUsername = extractSocialUsername(
                                linkedUsernameValue.data,
                                value,
                              );
                              if (extractedUsername)
                                field.onChange(removeAtSign(extractedUsername));
                              else field.onChange(removeAtSign(value));
                            } else {
                              if (lowercaseOnly.safeParse(name).success) {
                                field.onChange(
                                  removeAtSign(value.toLowerCase()),
                                );
                              } else {
                                field.onChange(removeAtSign(value));
                              }
                            }
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="pt-1" />
                  </FormItem>
                );
              }}
            />
          </div>
        );
      })}
    </>
  );
};
