import { Box, Flex, Icon, Input, Text } from '@chakra-ui/react';
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
} from '@/features/talent';

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
      {socials.map(({ name, label, placeholder, icon, required }) => {
        const value = watch(name);
        const displayValue = getDisplayValue(name, value);

        return (
          <Box key={name} mb={'1.25rem'}>
            <Flex align="center" justify="center" direction="row">
              <Box pos="relative">
                <Icon as={icon} boxSize={5} mr={3} color={'brand.slate.600'} />
                {required && (
                  <Text
                    as="span"
                    pos="absolute"
                    top="-5px"
                    right="4px"
                    color="red"
                    fontWeight={500}
                  >
                    *
                  </Text>
                )}
              </Box>
              {label && (
                <Box
                  h="2.6875rem"
                  px={3}
                  border="1px solid"
                  borderColor={'brand.slate.300'}
                  borderRight="none"
                  borderLeftRadius={'md'}
                >
                  <Flex
                    align="center"
                    justify={{ base: 'center', md: 'start' }}
                    w={'100%'}
                    h={'100%'}
                  >
                    <Text
                      h="4.3rem"
                      color={'brand.slate.600'}
                      fontSize={{ base: '0.7rem', md: '0.875rem' }}
                      fontWeight={500}
                      lineHeight="4.3rem"
                      textAlign="left"
                    >
                      {label}
                    </Text>
                  </Flex>
                </Box>
              )}
              <Input
                w="full"
                h="2.6875rem"
                color={'gray.800'}
                fontSize="0.875rem"
                fontWeight={500}
                borderColor={'brand.slate.300'}
                borderLeftRadius={label ? 0 : 6}
                _placeholder={{
                  color: 'brand.slate.300',
                }}
                focusBorderColor="brand.purple"
                placeholder={placeholder}
                value={displayValue}
                {...register(name, {
                  validate: (value) => validateSocial(value, name),
                })}
              />
            </Flex>
          </Box>
        );
      })}
    </>
  );
};
