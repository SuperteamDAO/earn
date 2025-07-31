import React, { useMemo } from 'react';
import { type Control } from 'react-hook-form';

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
                  'flex h-[2.6875rem] items-center justify-center',
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
                  <div className="relative flex-1">
                    <Input
                      {...field}
                      className={cn(
                        'h-9 w-full',
                        social?.label ? 'rounded-l-none' : 'rounded-md',
                        'placeholder:text-sm',
                        showVerification &&
                          (needsVerification || isVerified) &&
                          'pr-10',
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
                    {showVerification && isVerified && (
                      <div className="absolute top-1/2 right-2 -translate-y-1/2">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3.84922 8.6201L4.38398 9.4651L4.97773 9.08934L4.82545 8.40337L3.84922 8.6201ZM8.62922 3.8501L8.41045 4.82587L9.09422 4.97918L9.47172 4.38879L8.62922 3.8501ZM11.9992 2.00488V3.00488V2.00488ZM15.3692 3.8501L14.5267 4.38879L14.9044 4.97955L15.5886 4.82574L15.3692 3.8501ZM20.1492 8.6301L19.1736 8.41074L19.0198 9.09486L19.6105 9.4726L20.1492 8.6301ZM20.1492 15.3701L19.6105 14.5276L19.0201 14.9051L19.1734 15.5889L20.1492 15.3701ZM15.3792 20.1501L15.5959 19.1739L14.9117 19.022L14.5355 19.6134L15.3792 20.1501ZM8.62922 20.1501L9.47297 19.6134L9.09592 19.0206L8.41045 19.1743L8.62922 20.1501ZM3.84922 15.3801L4.82545 15.5968L4.97773 14.9109L4.38398 14.5351L3.84922 15.3801ZM1.98828 12.0001H2.98828H1.98828ZM3.84922 8.6201L4.82545 8.40337C4.71598 7.91027 4.73279 7.39751 4.87432 6.91263L3.91437 6.63244L2.95443 6.35224C2.71855 7.16037 2.69053 8.01498 2.87298 8.83682L3.84922 8.6201ZM3.91437 6.63244L4.87432 6.91263C5.01585 6.42775 5.27751 5.98646 5.63505 5.62967L4.92868 4.92182L4.22232 4.21397C3.62642 4.80863 3.19031 5.54412 2.95443 6.35224L3.91437 6.63244ZM4.92868 4.92182L5.63505 5.62967C5.99259 5.27287 6.43443 5.01213 6.9196 4.87162L6.64142 3.91109L6.36324 2.95056C5.55462 3.18475 4.81822 3.61932 4.22232 4.21397L4.92868 4.92182ZM6.64142 3.91109L6.9196 4.87162C7.40478 4.73111 7.91757 4.71537 8.41045 4.82587L8.62922 3.8501L8.84798 2.87432C8.02652 2.69015 7.17186 2.71638 6.36324 2.95056L6.64142 3.91109ZM8.62922 3.8501L9.47172 4.38879C9.743 3.96452 10.1167 3.61536 10.5584 3.37351L10.0782 2.49638L9.5979 1.61926C8.86172 2.02235 8.23885 2.60428 7.78672 3.3114L8.62922 3.8501ZM10.0782 2.49638L10.5584 3.37351C11.0001 3.13165 11.4956 3.00488 11.9992 3.00488V2.00488V1.00488C11.1599 1.00488 10.3341 1.21617 9.5979 1.61926L10.0782 2.49638ZM11.9992 2.00488V3.00488C12.5028 3.00488 12.9983 3.13165 13.44 3.37351L13.9203 2.49638L14.4005 1.61926C13.6643 1.21617 12.8385 1.00488 11.9992 1.00488V2.00488ZM13.9203 2.49638L13.44 3.37351C13.8817 3.61536 14.2554 3.96452 14.5267 4.38879L15.3692 3.8501L16.2117 3.3114C15.7596 2.60428 15.1367 2.02235 14.4005 1.61926L13.9203 2.49638ZM15.3692 3.8501L15.5886 4.82574C16.0822 4.71476 16.5959 4.73042 17.0818 4.87128L17.3602 3.91081L17.6386 2.95034C16.8287 2.71559 15.9726 2.68948 15.1499 2.87445L15.3692 3.8501ZM17.3602 3.91081L17.0818 4.87128C17.5678 5.01213 18.0102 5.2736 18.368 5.63136L19.0751 4.92425L19.7822 4.21714C19.1859 3.62088 18.4485 3.1851 17.6386 2.95034L17.3602 3.91081ZM19.0751 4.92425L18.368 5.63136C18.7257 5.98912 18.9872 6.43155 19.128 6.91749L20.0885 6.6391L21.049 6.3607C20.8142 5.55079 20.3784 4.81341 19.7822 4.21714L19.0751 4.92425ZM20.0885 6.6391L19.128 6.91749C19.2689 7.40344 19.2846 7.91712 19.1736 8.41074L20.1492 8.6301L21.1249 8.84945C21.3098 8.02674 21.2837 7.17062 21.049 6.3607L20.0885 6.6391ZM20.1492 8.6301L19.6105 9.4726C20.0348 9.74388 20.3839 10.1176 20.6258 10.5593L21.5029 10.079L22.3801 9.59879C21.977 8.8626 21.395 8.23973 20.6879 7.7876L20.1492 8.6301ZM21.5029 10.079L20.6258 10.5593C20.8677 11.001 20.9944 11.4965 20.9944 12.0001H21.9944H22.9944C22.9944 11.1608 22.7831 10.335 22.3801 9.59879L21.5029 10.079ZM21.9944 12.0001H20.9944C20.9944 12.5037 20.8677 12.9992 20.6258 13.4409L21.5029 13.9211L22.3801 14.4014C22.7831 13.6652 22.9944 12.8394 22.9944 12.0001H21.9944ZM21.5029 13.9211L20.6258 13.4409C20.3839 13.8826 20.0348 14.2563 19.6105 14.5276L20.1492 15.3701L20.6879 16.2126C21.395 15.7605 21.977 15.1376 22.3801 14.4014L21.5029 13.9211ZM20.1492 15.3701L19.1734 15.5889C19.2839 16.0817 19.2682 16.5945 19.1277 17.0797L20.0882 17.3579L21.0488 17.6361C21.2829 16.8274 21.3092 15.9728 21.125 15.1513L20.1492 15.3701ZM20.0882 17.3579L19.1277 17.0797C18.9872 17.5649 18.7264 18.0067 18.3696 18.3643L19.0775 19.0706L19.7853 19.777C20.38 19.1811 20.8146 18.4447 21.0488 17.6361L20.0882 17.3579ZM19.0775 19.0706L18.3696 18.3643C18.0129 18.7218 17.5716 18.9835 17.0867 19.125L17.3669 20.0849L17.6471 21.0449C18.4552 20.809 19.1907 20.3729 19.7853 19.777L19.0775 19.0706ZM17.3669 20.0849L17.0867 19.125C16.6018 19.2665 16.089 19.2833 15.5959 19.1739L15.3792 20.1501L15.1625 21.1263C15.9843 21.3088 16.8389 21.2808 17.6471 21.0449L17.3669 20.0849ZM15.3792 20.1501L14.5355 19.6134C14.2645 20.0393 13.8905 20.3899 13.4481 20.6329L13.9293 21.5094L14.4106 22.386C15.1481 21.9811 15.7714 21.3967 16.223 20.6868L15.3792 20.1501ZM13.9293 21.5094L13.4481 20.6329C13.0056 20.8758 12.509 21.0032 12.0042 21.0032V22.0032V23.0032C12.8455 23.0032 13.6732 22.7909 14.4106 22.386L13.9293 21.5094ZM12.0042 22.0032V21.0032C11.4994 21.0032 11.0028 20.8758 10.5604 20.6329L10.0791 21.5094L9.59781 22.386C10.3352 22.7909 11.1629 23.0032 12.0042 23.0032V22.0032ZM10.0791 21.5094L10.5604 20.6329C10.1179 20.3899 9.7439 20.0393 9.47297 19.6134L8.62922 20.1501L7.78547 20.6868C8.23701 21.3967 8.86037 21.9811 9.59781 22.386L10.0791 21.5094ZM8.62922 20.1501L8.41045 19.1743C7.91757 19.2848 7.40478 19.2691 6.9196 19.1286L6.64142 20.0891L6.36324 21.0496C7.17186 21.2838 8.02653 21.31 8.84798 21.1259L8.62922 20.1501ZM6.64142 20.0891L6.9196 19.1286C6.43443 18.9881 5.99259 18.7273 5.63505 18.3705L4.92868 19.0784L4.22232 19.7862C4.81822 20.3809 5.55462 20.8154 6.36324 21.0496L6.64142 20.0891ZM4.92868 19.0784L5.63505 18.3705C5.27751 18.0137 5.01585 17.5724 4.87432 17.0876L3.91437 17.3678L2.95443 17.648C3.19031 18.4561 3.62642 19.1916 4.22232 19.7862L4.92868 19.0784ZM3.91437 17.3678L4.87432 17.0876C4.73279 16.6027 4.71598 16.0899 4.82545 15.5968L3.84922 15.3801L2.87298 15.1634C2.69053 15.9852 2.71855 16.8398 2.95443 17.648L3.91437 17.3678ZM3.84922 15.3801L4.38398 14.5351C3.95645 14.2645 3.60429 13.8902 3.36027 13.447L2.48426 13.9293L1.60826 14.4116C2.01497 15.1503 2.6019 15.7742 3.31445 16.2251L3.84922 15.3801ZM2.48426 13.9293L3.36027 13.447C3.11624 13.0038 2.98828 12.5061 2.98828 12.0001H1.98828H0.988281C0.988281 12.8434 1.20155 13.6729 1.60826 14.4116L2.48426 13.9293ZM1.98828 12.0001H2.98828C2.98828 11.4941 3.11624 10.9964 3.36027 10.5532L2.48426 10.0709L1.60826 9.58858C1.20155 10.3273 0.988281 11.1568 0.988281 12.0001H1.98828ZM2.48426 10.0709L3.36027 10.5532C3.60429 10.11 3.95645 9.73566 4.38398 9.4651L3.84922 8.6201L3.31445 7.7751C2.6019 8.22604 2.01497 8.84988 1.60826 9.58858L2.48426 10.0709Z"
                            fill="#16A34A"
                          />
                          <path
                            d="M9 12L11 14L15 10"
                            stroke="#16A34A"
                            strokeWidth="2"
                            strokeLinecap="square"
                          />
                        </svg>
                      </div>
                    )}
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
