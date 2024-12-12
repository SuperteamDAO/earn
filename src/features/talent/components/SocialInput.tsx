import React from 'react';
import { type UseFormRegister, type UseFormWatch } from 'react-hook-form';
import {
  FaDiscord,
  FaGithub,
  FaGlobe,
  FaLinkedin,
  FaTelegram,
  FaXTwitter,
} from 'react-icons/fa6';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import {
  isValidDiscordInput,
  isValidGitHubInput,
  isValidGitHubUsername,
  isValidLinkedInInput,
  isValidLinkedInUsername,
  isValidTelegramInput,
  isValidTelegramUsername,
  isValidTwitterInput,
  isValidTwitterUsername,
  isValidWebsiteUrl,
} from '@/features/social';
import { cn } from '@/utils';

type SocialInputProps = {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
};

export const socials = [
  {
    name: 'discord',
    placeholder: 'johncena',
    icon: FaDiscord,
    required: true,
  },
  {
    name: 'twitter',
    label: 'x.com/',
    placeholder: 'johncena',
    icon: FaXTwitter,
    prefix: 'https://x.com/',
  },
  {
    name: 'github',
    label: 'github.com/',
    placeholder: 'johncena',
    icon: FaGithub,
    prefix: 'https://github.com/',
  },
  {
    name: 'linkedin',
    label: 'linkedin.com/in/',
    placeholder: 'johncena',
    icon: FaLinkedin,
    prefix: 'https://linkedin.com/in/',
  },
  {
    name: 'telegram',
    label: 't.me/',
    placeholder: 'tonystark',
    icon: FaTelegram,
    prefix: 'https://t.me/',
  },
  {
    name: 'website',
    placeholder: 'https://starkindustries.com',
    icon: FaGlobe,
  },
];

export const SocialInput = ({ register, watch }: SocialInputProps) => {
  const validateSocial = (value: string, name: string) => {
    if (name === 'discord' && !value) {
      toast.error('Discord is required');
      return false;
    }
    if (value) {
      switch (name) {
        case 'discord':
          if (!isValidDiscordInput(value)) {
            toast.error('Invalid Discord username');
            return false;
          }
          break;
        case 'twitter':
          if (!isValidTwitterInput(value) && !isValidTwitterUsername(value)) {
            toast.error('Invalid Twitter username or URL');
            return false;
          }
          break;
        case 'github':
          if (!isValidGitHubInput(value) && !isValidGitHubUsername(value)) {
            toast.error('Invalid GitHub username or URL');
            return false;
          }
          break;
        case 'linkedin':
          if (!isValidLinkedInInput(value) && !isValidLinkedInUsername(value)) {
            toast.error('Invalid LinkedIn username or URL');
            return false;
          }
          break;
        case 'telegram':
          if (!isValidTelegramInput(value) && !isValidTelegramUsername(value)) {
            toast.error('Invalid Telegram username or URL');
            return false;
          }
          break;
        case 'website':
          if (!isValidWebsiteUrl(value)) {
            toast.error('Invalid website URL');
            return false;
          }
          break;
      }
    }
    return true;
  };

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
        const value = watch(name);
        const displayValue = getDisplayValue(name, value);

        return (
          <div className="mb-5" key={name}>
            <div className="flex items-center justify-center">
              <div className="relative">
                <Icon className="mr-3 h-5 w-5 text-slate-600" />
                {required && (
                  <span className="absolute -top-1 right-1 font-medium text-red-500">
                    *
                  </span>
                )}
              </div>

              {label && (
                <div className="flex h-[2.6875rem] items-center justify-center rounded-l-md border border-r-0 border-slate-300 px-3 md:justify-start">
                  <p className="h-[4.3rem] text-left text-xs font-medium text-slate-600 md:text-sm">
                    {label}
                  </p>
                </div>
              )}

              <Input
                className={cn(
                  'h-[2.6875rem] w-full text-sm font-medium text-gray-800',
                  'border-slate-300',
                  'placeholder:text-slate-300',
                  'focus:border-brand-purple focus:ring-brand-purple',
                  label ? 'rounded-l-none' : 'rounded-md',
                )}
                placeholder={placeholder}
                value={displayValue}
                {...register(name, {
                  validate: (value) => validateSocial(value, name),
                })}
              />
            </div>
          </div>
        );
      })}
    </>
  );
};
