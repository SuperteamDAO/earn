import { useMemo } from 'react';
import { type Control } from 'react-hook-form';

import { VerifiedXIcon } from '@/components/icons/VerifiedXIcon';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
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
  required?: SocialType[];
};

export const SocialInputAll = ({ control, required }: SocialInputAllProps) => {
  return (
    <>
      {socials.map(({ name, placeholder }) => {
        return (
          <div className="mb-5" key={name}>
            <SocialInput
              name={name}
              socialName={name}
              placeholder={placeholder}
              required={required?.includes(name)}
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
  formDescription?: string;
  height?: string;
  classNames?: {
    input?: string;
  };
  showIcon?: boolean;
  showVerification?: boolean;
  needsVerification?: boolean;
  isVerified?: boolean;
  onVerify?: () => void;
  isPro?: boolean;
}
export const SocialInput = ({
  control,
  name,
  required,
  socialName,
  placeholder,
  formLabel,
  formDescription,
  height,
  classNames,
  showIcon = true,
  showVerification = false,
  needsVerification = false,
  isVerified = false,
  onVerify,
  isPro = false,
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
              {(formLabel || formDescription) && (
                <div>
                  {formLabel && (
                    <FormLabel isRequired={required}>{formLabel}</FormLabel>
                  )}
                  {formDescription && (
                    <FormDescription>{formDescription}</FormDescription>
                  )}
                </div>
              )}
              <div
                className={cn(
                  'flex h-10.75 items-center justify-center',
                  height,
                )}
              >
                <FormLabel className="relative">
                  <span className="sr-only">{name}</span>
                  {Icon && showIcon && (
                    <Icon
                      className={cn(
                        'mr-2 h-5 w-5 text-slate-600',
                        // socialName === 'twitter' && 'h-[1.125rem] w-[1.125rem]'
                      )}
                    />
                  )}
                  {required && !formLabel && (
                    <span className="absolute -top-1 right-1 font-medium text-red-500">
                      *
                    </span>
                  )}
                </FormLabel>

                {social?.label && (
                  <div className="flex h-full items-center justify-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-xs font-medium text-slate-600 shadow-xs md:justify-start md:text-sm">
                    {social?.label}
                  </div>
                )}

                <FormControl>
                  <div className="relative h-full flex-1">
                    <Input
                      {...field}
                      className={cn(
                        'h-full w-full',
                        social?.label ? 'rounded-l-none' : 'rounded-md',
                        'placeholder:text-sm',
                        showVerification &&
                          (needsVerification || isVerified) &&
                          'pr-10',
                        isPro && 'focus-visible:ring-zinc-400',
                        classNames?.input,
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
                    {showVerification && needsVerification && (
                      <Button
                        type="button"
                        onClick={onVerify}
                        size="sm"
                        className="absolute top-1/2 right-1 h-7 -translate-y-1/2 px-3 text-xs"
                      >
                        Verify
                      </Button>
                    )}
                    {showVerification && isVerified && <VerifiedXIcon />}
                  </div>
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
