import React, { useMemo } from 'react';
import { type Control } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

import { socials, type SocialType } from '../utils/constants';
import {
  extractSocialUsername,
  linkedUsernames,
  lowercaseOnly,
  removeAtSign,
} from '../utils/extractUsername';

const getDisplayValue = (name: SocialType, value: string) => {
  const social = socials.find((s) => s.name === name);
  if (social?.prefix && value?.startsWith(social.prefix)) {
    return value.slice(social.prefix.length);
  }
  return value;
};

type SocialInputAllProps = {
  control: Control<any>;
};

export const SocialInputAll = ({ control }: SocialInputAllProps) => {
  return (
    <>
      {socials.map(({ name, placeholder, required }) => {
        return (
          <div className="mb-5" key={name}>
            <SocialInput
              name={name}
              socialName={name}
              placeholder={placeholder}
              required={required}
              control={control}
            />
          </div>
        );
      })}
    </>
  );
};

interface SocialInputProps {
  control: Control<any>;
  name: string;
  socialName: SocialType;
  required?: boolean;
  placeholder?: string;
  formLabel?: string;
  height?: string;
}
export const SocialInput = ({
  control,
  name,
  required,
  socialName,
  placeholder,
  formLabel,
  height,
}: SocialInputProps) => {
  const social = useMemo(
    () => socials.find((s) => s.name === socialName),
    [socials, socialName],
  );
  const Icon = social?.icon;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const displayValue = getDisplayValue(socialName, field.value);
        return (
          <FormItem className="">
            <div className="flex flex-col gap-2">
              {formLabel && (
                <FormLabel isRequired={required}>{formLabel}</FormLabel>
              )}
              <div
                className={cn(
                  'flex h-[2.6875rem] items-center justify-center',
                  height,
                )}
              >
                <FormLabel className="relative">
                  <span className="sr-only">{name}</span>
                  {Icon && <Icon className="mr-3 h-5 w-5 text-slate-600" />}
                  {required && !formLabel && (
                    <span className="absolute -top-1 right-1 font-medium text-red-500">
                      *
                    </span>
                  )}
                </FormLabel>

                {social?.label && (
                  <div className="flex h-full items-center justify-center rounded-l-md border border-r-0 border-slate-300 px-3 text-xs font-medium text-slate-600 shadow-sm md:justify-start md:text-sm">
                    {social?.label}
                  </div>
                )}

                <FormControl>
                  <Input
                    {...field}
                    className={cn(
                      'h-full w-full',
                      social?.label ? 'rounded-l-none' : 'rounded-md',
                    )}
                    placeholder={placeholder}
                    value={displayValue}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      const linkedUsernameValue =
                        linkedUsernames.safeParse(socialName);
                      if (linkedUsernameValue.data) {
                        const extractedUsername = extractSocialUsername(
                          linkedUsernameValue.data,
                          value,
                        );
                        if (extractedUsername)
                          field.onChange(removeAtSign(extractedUsername));
                        else field.onChange(removeAtSign(value));
                      } else {
                        if (lowercaseOnly.safeParse(socialName).success) {
                          field.onChange(removeAtSign(value.toLowerCase()));
                        } else {
                          field.onChange(removeAtSign(value));
                        }
                      }
                    }}
                  />
                </FormControl>
              </div>
            </div>
            <FormMessage className="pt-1" />
          </FormItem>
        );
      }}
    />
  );
};
