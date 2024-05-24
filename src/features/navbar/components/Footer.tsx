import {
  Box,
  chakra,
  Container,
  Flex,
  Image,
  Link,
  Stack,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

import { Superteams } from '@/constants/Superteam';
import { getURL } from '@/utils/validUrl';

const getCurrentYear = () => {
  return new Date().getFullYear();
};

const linkData = [
  {
    text: 'FAQ',
    href: 'https://superteamdao.notion.site/Superteam-Earn-FAQ-aedaa039b25741b1861167d68aa880b1?pvs=4',
  },
  {
    text: 'GitHub',
    href: 'https://github.com/SuperteamDAO/earn',
  },
  {
    text: 'Changelog',
    href: 'https://superteamdao.notion.site/Superteam-Earn-Changelog-faf0c85972a742699ecc07a52b569827',
  },
];

const superteamProductions = [
  {
    text: 'Build',
    href: 'https://build.superteam.fun',
  },
  {
    text: 'Media',
    href: 'https://superteam.substack.com/',
  },
  {
    text: 'Podcast',
    href: 'https://www.youtube.com/@superteampodcast',
  },
];

const SocialButton = ({
  children,
  label,
  href,
}: {
  children: ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <chakra.button
      bg={'blackAlpha.100'}
      color="brand.slate.600"
      rounded={'full'}
      w={8}
      h={8}
      cursor={'pointer'}
      as={'a'}
      href={href}
      display={'inline-flex'}
      alignItems={'center'}
      justifyContent={'center'}
      transition={'background 0.3s ease'}
      _hover={{
        bg: 'blackAlpha.500',
      }}
      target="_blank"
      rel="noreferrer"
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </chakra.button>
  );
};

export const Footer = () => {
  return (
    <Box
      color={'brand.slate.500'}
      bg={'white'}
      borderTop="1px solid"
      borderTopColor="blackAlpha.200"
    >
      <Container as={Stack} maxW={'8xl'} py={{ base: 4, md: 6 }}>
        <Flex
          justify={'space-between'}
          direction={{ base: 'column', md: 'row' }}
        >
          <Stack maxW="540px" mr={{ base: 0, md: 32 }} spacing={6}>
            <Box>
              <Link as={NextLink} href="/">
                <Image
                  h={{ base: 6, md: 8 }}
                  color="brand.slate.500"
                  cursor="pointer"
                  objectFit={'contain'}
                  alt={'Superteam Earn'}
                  src={'/assets/logo/logo.svg'}
                />
              </Link>
            </Box>
            <Text color="brand.slate.500" fontSize={{ base: 'sm', md: 'md' }}>
              Superteam Earn is where crypto founders meet world-class talent.
              Distribute your work to crypto-native talent, meet your next team
              member & get things done fast. <br />
              <br />© {getCurrentYear()} Superteam. All rights reserved.
            </Text>
            <Stack direction={'row'} mb={6} spacing={6}>
              <SocialButton
                label={'Twitter'}
                href="https://twitter.com/superteamearn"
              >
                <svg
                  width="17"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    fill="currentColor"
                  />
                </svg>
              </SocialButton>
              <SocialButton
                label={'Discord'}
                href="https://discord.com/invite/Mq3ReaekgG"
              >
                <svg
                  width="17"
                  height="13"
                  viewBox="0 0 17 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.3915 1.05751C13.3078 0.568756 12.1461 0.207506 10.9313 0.0020897C10.9205 1.2808e-05 10.9093 0.00135123 10.8993 0.00591989C10.8893 0.0104886 10.8809 0.0180614 10.8754 0.0275897C10.7266 0.288965 10.5609 0.629673 10.4447 0.89884C9.15632 0.706341 7.84648 0.706341 6.55809 0.89884C6.4287 0.600532 6.2828 0.309665 6.12105 0.0275897C6.11557 0.0179441 6.10727 0.0101999 6.09727 0.00539063C6.08728 0.000581304 6.07605 -0.00106449 6.06509 0.000672968C4.85101 0.20609 3.68934 0.56734 2.60488 1.0568C2.59555 1.06071 2.58764 1.06738 2.58222 1.07592C0.377882 4.31655 -0.226326 7.47713 0.0704654 10.598C0.0712913 10.6057 0.0736639 10.6131 0.0774389 10.6198C0.0812139 10.6265 0.0863123 10.6323 0.0924238 10.637C1.37904 11.5737 2.81408 12.2873 4.33747 12.7478C4.34809 12.7511 4.35944 12.7511 4.37006 12.7478C4.38067 12.7445 4.39005 12.7381 4.39697 12.7294C4.72422 12.2903 5.01605 11.8263 5.26538 11.339C5.28026 11.3106 5.26609 11.2766 5.23634 11.2653C4.77876 11.093 4.3354 10.885 3.91034 10.6434C3.9027 10.639 3.89627 10.6328 3.89161 10.6254C3.88695 10.6179 3.88422 10.6094 3.88366 10.6006C3.8831 10.5919 3.88472 10.5831 3.88839 10.5751C3.89206 10.5671 3.89765 10.5601 3.90467 10.5548C3.99392 10.489 4.08317 10.4203 4.16817 10.3515C4.17583 10.3454 4.18504 10.3414 4.1948 10.3402C4.20455 10.3389 4.21446 10.3404 4.22342 10.3445C7.00505 11.594 10.0176 11.594 12.7666 10.3445C12.7756 10.3402 12.7856 10.3385 12.7955 10.3396C12.8054 10.3408 12.8148 10.3446 12.8226 10.3508C12.9076 10.4203 12.9961 10.489 13.0861 10.5548C13.0932 10.56 13.0989 10.5669 13.1027 10.5748C13.1064 10.5827 13.1082 10.5915 13.1078 10.6003C13.1074 10.609 13.1048 10.6176 13.1002 10.6251C13.0957 10.6326 13.0894 10.6389 13.0818 10.6434C12.6583 10.887 12.2177 11.0932 11.7551 11.2646C11.748 11.2672 11.7416 11.2712 11.7362 11.2765C11.7307 11.2818 11.7265 11.2882 11.7238 11.2952C11.721 11.3022 11.7198 11.3098 11.7202 11.3173C11.7206 11.3249 11.7226 11.3323 11.7261 11.339C11.9811 11.8256 12.2729 12.2888 12.5938 12.7287C12.6005 12.7377 12.6098 12.7445 12.6204 12.748C12.6311 12.7516 12.6425 12.7518 12.6533 12.7485C14.1793 12.2893 15.6167 11.5754 16.9047 10.637C16.911 10.6326 16.9163 10.6269 16.9202 10.6203C16.9241 10.6137 16.9265 10.6064 16.9274 10.5988C17.2815 6.9905 16.3338 3.85542 14.4135 1.07734C14.4088 1.06831 14.401 1.06127 14.3915 1.05751ZM5.68117 8.69759C4.84392 8.69759 4.1533 7.94038 4.1533 7.01175C4.1533 6.08242 4.83047 5.32592 5.68117 5.32592C6.53826 5.32592 7.22251 6.0888 7.20905 7.01175C7.20905 7.94109 6.53188 8.69759 5.68117 8.69759V8.69759ZM11.3301 8.69759C10.4922 8.69759 9.80226 7.94038 9.80226 7.01175C9.80226 6.08242 10.4787 5.32592 11.3301 5.32592C12.1872 5.32592 12.8715 6.0888 12.858 7.01175C12.858 7.94109 12.1879 8.69759 11.3301 8.69759V8.69759Z"
                    fill="currentColor"
                  />
                </svg>
              </SocialButton>
              <SocialButton
                label={'Substack'}
                href="https://superteam.substack.com/"
              >
                <svg
                  width="12"
                  height="13"
                  viewBox="0 0 12 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.4178 4.46442H0V2.92825H11.4183V4.46442H11.4178ZM0 5.8565V13L5.70917 9.80958L11.4183 13V5.8565H0ZM11.4183 0H0V1.53617H11.4183V0Z"
                    fill="currentColor"
                  />
                </svg>
              </SocialButton>
            </Stack>
          </Stack>
          <Flex justify={'space-between'} gap={{ base: 16, md: 24 }}>
            <Stack align={'flex-start'}>
              <Text
                color={'brand.slate.400'}
                fontSize={{ base: 'xs', md: 'sm' }}
                fontWeight={'500'}
                whiteSpace={'nowrap'}
              >
                ALL SUPERTEAMS
              </Text>
              {Superteams.map((st) => (
                <Link
                  key={st.region}
                  as={NextLink}
                  color="brand.slate.500"
                  fontSize={{ base: 'sm', md: 'md' }}
                  _hover={{
                    color: 'brand.slate.600',
                  }}
                  href={`${getURL()}regions/${st.region?.toLowerCase()}`}
                  isExternal
                >
                  {st.displayValue}
                </Link>
              ))}
            </Stack>
            <Stack align={'flex-start'} gap={2} mr={3}>
              {linkData.map((link) => (
                <Link
                  key={link.text}
                  color={'brand.slate.500'}
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight={'500'}
                  href={link.href}
                  isExternal
                >
                  {link.text}
                </Link>
              ))}
              <Text
                mt={4}
                color={'brand.slate.400'}
                fontSize={{ base: 'xs', md: 'sm' }}
                fontWeight={'500'}
                whiteSpace={'nowrap'}
              >
                SUPERTEAM PRODUCTIONS
              </Text>
              {superteamProductions.map((link) => (
                <Link
                  key={link.text}
                  as={NextLink}
                  color="brand.slate.500"
                  fontSize={{ base: 'sm', md: 'md' }}
                  href={link.href}
                  isExternal
                >
                  {link.text}
                </Link>
              ))}
            </Stack>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};
