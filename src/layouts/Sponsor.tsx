import { AddIcon } from '@chakra-ui/icons';
import type { BoxProps, FlexProps } from '@chakra-ui/react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  Image,
  Link,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  UnorderedList,
  useDisclosure,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import type { ReactNode, ReactText } from 'react';
import React from 'react';
import type { IconType } from 'react-icons';
import { MdList, MdOutlineGroup } from 'react-icons/md';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Banner } from '@/components/sponsor/Banner';
import { SelectSponsor } from '@/components/sponsor/SelectSponsor';
import { SolanaWalletProvider } from '@/context/SolanaWallet';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

interface LinkItemProps {
  name: string;
  link: string;
  icon: IconType;
}

const LinkItems: Array<LinkItemProps> = [
  { name: 'My Listings', link: '/listings', icon: MdList },
  { name: 'Members', link: '/members', icon: MdOutlineGroup },
];

interface NavItemProps extends FlexProps {
  icon: IconType;
  link: string;
  isActive: boolean;
  children: ReactText;
}

const NavItem = ({ icon, link, isActive, children, ...rest }: NavItemProps) => {
  return (
    <Link
      as={NextLink}
      _focus={{ boxShadow: 'none' }}
      href={`/dashboard${link}`}
      style={{ textDecoration: 'none' }}
    >
      <Flex
        align="center"
        mb={2}
        px={6}
        py={3}
        color={isActive ? 'brand.purple' : 'brand.slate.500'}
        bg={isActive ? 'brand.slate.100' : 'transparent'}
        _hover={{
          bg: 'brand.slate.100',
          color: 'brand.purple',
        }}
        cursor="pointer"
        role="group"
        {...rest}
      >
        {icon && (
          <Icon
            as={icon}
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'brand.purple',
            }}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

const SidebarContent = ({ ...rest }: BoxProps) => {
  const router = useRouter();
  const currentPath = `/${router.route?.split('/')[2]}` || '';
  const { userInfo } = userStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box
      w={{ base: 0, md: 80 }}
      h="full"
      pt={8}
      pb={80}
      bg="white"
      borderRight={'1px solid'}
      borderRightColor={'blackAlpha.200'}
      {...rest}
    >
      {userInfo?.role === 'GOD' && (
        <Box px={6} pb={6}>
          <SelectSponsor />
        </Box>
      )}
      <Modal isOpen={isOpen} onClose={onClose} size={'5xl'}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton color={'brand.slate.300'} />
          <Flex>
            <Flex direction={'column'} w="50%" px={6} py={4}>
              <Image
                w={14}
                h={16}
                mt={1}
                alt={'New Bounty'}
                src={'/assets/icons/bolt.svg'}
              />
              <Text
                mt={4}
                color="brand.slate.800"
                fontSize={'xl'}
                fontWeight={600}
              >
                Create a Bounty
              </Text>
              <Text mt={2} color="brand.slate.500">
                Bounties are listings where all participants do the work, and
                the best submission(s) are rewarded
              </Text>
              <Text mt={16} color="brand.slate.500" fontWeight={700}>
                Great for:
              </Text>
              <UnorderedList mt={1} mb={4} ml={6} color="brand.slate.500">
                <ListItem>
                  raising awareness for your product, specific features,
                  campaigns, etc.
                </ListItem>
                <ListItem>
                  or, when you want multiple deliverable options to choose from
                </ListItem>
                <ListItem>
                  Examples: Twitter threads, deep dive articles, merch/logo
                  design, product feedback, etc.
                </ListItem>
              </UnorderedList>
              <Box flex="1" />
              <Button as={NextLink} href="/dashboard/create-bounty" size="lg">
                Create New Bounty
              </Button>
            </Flex>
            <Divider
              w="1px"
              h="lg"
              borderColor={'brand.slate.200'}
              orientation="vertical"
            />
            <Flex direction={'column'} w="50%" px={6} py={4}>
              <Image
                w={14}
                h={16}
                mt={1}
                alt={'New Project'}
                src={'/assets/icons/briefcase.svg'}
              />
              <Text
                mt={4}
                color="brand.slate.800"
                fontSize={'xl'}
                fontWeight={600}
              >
                Create a Project
              </Text>
              <Text mt={2} color="brand.slate.500">
                Solicit applications based on a custom questionnaire, and select
                one applicant to work on your listing
              </Text>
              <Text mt={16} color="brand.slate.500" fontWeight={700}>
                Great for:
              </Text>
              <UnorderedList mt={1} mb={4} ml={6} color="brand.slate.500">
                <ListItem>the work to be done is very specific, or</ListItem>
                <ListItem>it would require iteration and feedback</ListItem>
                <ListItem>
                  Example: Website / app development, website / app design, hype
                  video creation, hiring a Twitter manager, etc.
                </ListItem>
              </UnorderedList>
              <Box flex="1" />
              <Divider
                w="120px"
                color="brand.slate.200"
                orientation="horizontal"
              />
              <Button as={NextLink} href="/dashboard/create-project" size="lg">
                Create New Project
              </Button>
            </Flex>
          </Flex>
        </ModalContent>
      </Modal>
      <Flex align="center" justify="space-between" px={6} pb={6}>
        <Button
          w="full"
          py={'22px'}
          fontSize="md"
          leftIcon={<AddIcon w={3} h={3} />}
          onClick={() => onOpen()}
          variant="solid"
        >
          Create New Listing
        </Button>
      </Flex>
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          link={link.link}
          icon={link.icon}
          isActive={currentPath === link.link}
        >
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

export function Sidebar({
  children,
  showBanner = true,
}: {
  children: ReactNode;
  showBanner?: boolean;
}) {
  const { userInfo } = userStore();
  const { data: session, status } = useSession();
  const router = useRouter();

  if (!session && status === 'loading') {
    return <LoadingSection />;
  }

  if (!session && status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  return (
    <SolanaWalletProvider>
      <Default
        className="bg-white"
        meta={
          <Meta
            title="Superteam Earn |  Bounties, Grants, and Jobs in Crypto"
            description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
            canonical="https://earn.superteam.fun"
          />
        }
      >
        <Flex justify="start">
          <SidebarContent display={{ base: 'none', md: 'block' }} />
          {!userInfo?.currentSponsor?.id ? (
            <LoadingSection />
          ) : (
            <Box w="full" px={6} py={8} bg="white">
              {showBanner && <Banner />}
              {children}
            </Box>
          )}
        </Flex>
      </Default>
    </SolanaWalletProvider>
  );
}
