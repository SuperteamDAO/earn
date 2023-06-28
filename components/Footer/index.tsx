/* eslint-disable @next/next/no-img-element */
import { Flex, Link, Stack, Text } from '@chakra-ui/react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { getURL } from '@/utils/validUrl';

const TwitterIcon = '/assets/talent/twitter.svg';
const BookmarkIcon = '/assets/landingsponsor/icons/bookmark.svg';
const DiscordIcon = '/assets/landingsponsor/icons/discord.svg';

type Props = {
  style?: any;
};
const ListHeader = ({ children }: { children: ReactNode }) => {
  return (
    <Text mb={2} color={'brand.slate.500'} fontSize={'lg'} fontWeight={'700'}>
      {children}
    </Text>
  );
};
export const Footer = ({ style }: Props) => (
  <footer
    style={{
      marginTop: 'auto',
      width: '100%',
      borderTop: '0.0625rem solid #E2E8EF',
      padding: '3.125rem 3.125rem',
      ...style,
    }}
  >
    <Flex align="start" justify="space-evenly" gap="1.875rem">
      <Flex align="start" gap="1.25rem" w="40%" flexFlow="column">
        <img src="/assets/logo/new-logo.svg" alt="Logo" />

        <Text color="gray.400" fontSize="1.0625rem" fontWeight={400}>
          Superteam Earn is where Solana founders find world class talent for
          their projects. Post bounties, meet your next team member & get things
          done fast.
        </Text>
        <Flex
          justify="space-around"
          justifySelf="flex-end"
          gap="1.25rem"
          mt="auto"
          mb="1.25rem"
        >
          <a
            href="https://discord.com/invite/Mq3ReaekgG"
            target="_blank"
            rel="noreferrer"
            style={{ cursor: 'pointer' }}
          >
            <Image src={DiscordIcon} alt="Discord" width="25px" height="25px" />
          </a>
          <a
            href="https://twitter.com/superteamearn"
            target="_blank"
            rel="noreferrer"
            style={{ cursor: 'pointer' }}
          >
            <Image src={TwitterIcon} alt="Discord" width="25px" height="25px" />
          </a>
          <a
            href="https://superteam.substack.com/"
            target="_blank"
            rel="noreferrer"
            style={{ cursor: 'pointer' }}
          >
            <Image
              src={BookmarkIcon}
              alt="Discord"
              width="25px"
              height="25px"
            />
          </a>
        </Flex>
      </Flex>
      <Stack align={'flex-start'}>
        <ListHeader>All Superteams</ListHeader>
        <Link
          color="brand.slate.500"
          _hover={{
            color: 'brand.slate.800',
          }}
          href={`${getURL()}regions/india`}
          isExternal
        >
          India
        </Link>
        <Link
          color="brand.slate.500"
          _hover={{
            color: 'brand.slate.800',
          }}
          href={`${getURL()}regions/germany`}
          isExternal
        >
          Germany
        </Link>
        <Link
          color="brand.slate.500"
          _hover={{
            color: 'brand.slate.800',
          }}
          href={`${getURL()}regions/mexico`}
          isExternal
        >
          Mexico
        </Link>
        <Link
          color="brand.slate.500"
          _hover={{
            color: 'brand.slate.800',
          }}
          href={`${getURL()}regions/turkey`}
          isExternal
        >
          Turkey
        </Link>
        <Link
          color="brand.slate.500"
          _hover={{
            color: 'brand.slate.800',
          }}
          href={`${getURL()}regions/vietnam`}
          isExternal
        >
          Vietnam
        </Link>
        <Link
          color="brand.slate.500"
          _hover={{
            color: 'brand.slate.800',
          }}
          href={`${getURL()}regions/uk`}
          isExternal
        >
          Uk
        </Link>
      </Stack>{' '}
      <Flex align="start" gap="0.625rem" flexFlow="column">
        <Text mb="1.25rem" color="#4D4D4D" fontSize="1.125rem" fontWeight={700}>
          Superteam Productions
        </Text>
        <Link mr="4" href="https://build.superteam.fun" isExternal>
          <Text color="gray.400" fontSize="1.0625rem" fontWeight={400}>
            Build
          </Text>
        </Link>
        <Link mr="4" href="https://superteam.substack.com/" isExternal>
          <Text color="gray.400" fontSize="1.0625rem" fontWeight={400}>
            Media
          </Text>
        </Link>
        <Link mr="4" href="https://superteam.fun/instagrants" isExternal>
          <Text color="gray.400" fontSize="1.0625rem" fontWeight={400}>
            Grants
          </Text>
        </Link>
        <Link
          mr="4"
          href="https://www.youtube.com/@superteampodcast"
          isExternal
        >
          <Text color="gray.400" fontSize="1.0625rem" fontWeight={400}>
            Podcast
          </Text>
        </Link>
      </Flex>
    </Flex>
  </footer>
);
