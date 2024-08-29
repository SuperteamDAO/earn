import { AddIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { type ReactNode, useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import { LuLayoutList, LuLock, LuMessageSquare, LuUsers } from 'react-icons/lu';
import { MdList, MdOutlineChatBubbleOutline } from 'react-icons/md';
import { RiUserSettingsLine } from 'react-icons/ri';

import { EntityNameModal } from '@/components/modals/EntityNameModal';
import { FeatureModal } from '@/components/modals/FeatureModal';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Tooltip } from '@/components/shared/responsive-tooltip';
import { Superteams } from '@/constants/Superteam';
import {
  isCreateListingAllowedQuery,
  SelectHackathon,
  SelectSponsor,
} from '@/features/listing-builder';
import {
  CreateListingModal,
  NavItem,
  SponsorInfoModal,
} from '@/features/sponsor-dashboard';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUpdateUser, useUser } from '@/store/user';

interface LinkItemProps {
  name: string;
  link?: string;
  icon: IconType;
  isExternal?: boolean;
  posthog?: string;
}

export function SponsorLayout({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const posthog = usePostHog();
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const { query } = router;

  const open = !!query.open; // Replace 'paramName' with the actual parameter name
  useEffect(() => {
    if (open) {
      onOpen();
    }
  }, [open]);

  const {
    data: isCreateListingAllowed,
    refetch: isCreateListingAllowedRefetch,
  } = useQuery(isCreateListingAllowedQuery);

  const {
    isOpen: isSponsorInfoModalOpen,
    onOpen: onSponsorInfoModalOpen,
    onClose: onSponsorInfoModalClose,
  } = useDisclosure();

  const { onOpen: onScoutAnnounceModalOpen } = useDisclosure();

  function sponsorInfoCloseAltered() {
    onSponsorInfoModalClose();
    if (user?.featureModalShown === false && user?.currentSponsorId)
      onScoutAnnounceModalOpen();
  }

  const handleEntityClose = () => {
    setIsEntityModalOpen(false);
  };

  // ENTITY NAME TO SPONSORS
  useEffect(() => {
    isCreateListingAllowedRefetch();
    const timer = setTimeout(async () => {
      if (user) {
        if (
          user.currentSponsorId &&
          (!user.firstName || !user.lastName || !user.username)
        ) {
          onSponsorInfoModalOpen();
        } else if (user.featureModalShown === false && user.currentSponsorId) {
          onScoutAnnounceModalOpen();
          await updateUser.mutateAsync({ featureModalShown: true });
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    const modalsToShow = async () => {
      if (
        user?.currentSponsorId &&
        (!user?.firstName || !user?.lastName || !user?.username)
      ) {
        onSponsorInfoModalOpen();
      } else if (user?.featureModalShown === false && user?.currentSponsorId) {
        onScoutAnnounceModalOpen();
        await updateUser.mutateAsync({ featureModalShown: true });
      }
    };
    modalsToShow();
  }, [user]);

  if (!session && status === 'loading') {
    return <LoadingSection />;
  }

  if (!session && status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  const isHackathonRoute = router.asPath.startsWith('/dashboard/hackathon');
  const isLocalProfileVisible = Superteams.some(
    (team) =>
      team.name === user?.currentSponsor?.name &&
      (user?.stLead === team.region || user?.stLead === 'MAHADEV'),
  );

  const LinkItems: Array<LinkItemProps> = isHackathonRoute
    ? [
        { name: 'All Tracks', link: `/hackathon`, icon: MdList },
        {
          name: 'Get Help',
          link: 'https://t.me/pratikdholani',
          icon: MdOutlineChatBubbleOutline,
          posthog: 'get help_sponsor',
        },
      ]
    : [
        { name: 'My Listings', link: '/listings', icon: LuLayoutList },
        {
          name: 'Team Settings',
          link: '/team-settings',
          icon: RiUserSettingsLine,
        },
        ...(isLocalProfileVisible
          ? [
              {
                name: 'Local Profiles',
                link: '/local-profiles',
                icon: LuUsers,
              },
            ]
          : []),
        {
          name: 'Get Help',
          link: 'https://t.me/pratikdholani',
          icon: LuMessageSquare,
          posthog: 'get help_sponsor',
        },
      ];

  const showLoading = !isHackathonRoute
    ? !user?.currentSponsor?.id
    : !user?.hackathonId && session?.user?.role !== 'GOD';

  const showContent = isHackathonRoute
    ? user?.hackathonId || session?.user?.role === 'GOD'
    : user?.currentSponsor?.id;

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Superteam Earn | Work to Earn in Crypto"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <FeatureModal
        isSponsorsRoute
        forceOpen={user?.featureModalShown === false}
      />

      <SponsorInfoModal
        onClose={sponsorInfoCloseAltered}
        isOpen={isSponsorInfoModalOpen}
      />
      <EntityNameModal isOpen={isEntityModalOpen} onClose={handleEntityClose} />
      <Flex display={{ base: 'flex', md: 'none' }} minH="80vh" px={3}>
        <Text
          align={'center'}
          pt={20}
          color={'brand.slate.500'}
          fontSize={'xl'}
          fontWeight={500}
        >
          The Sponsor Dashboard on Earn is not optimized for mobile yet. Please
          use a desktop to check out the Sponsor Dashboard
        </Text>
      </Flex>
      <Flex justify="start" display={{ base: 'none', md: 'flex' }} minH="100vh">
        <Box
          display={{ base: 'none', md: 'block' }}
          w={{ base: 0, md: 80 }}
          minH="100vh"
          pt={10}
          bg="white"
          borderRight={'1px solid'}
          borderRightColor={'blackAlpha.200'}
        >
          {session?.user?.role === 'GOD' && (
            <Box px={6} pb={6}>
              {isHackathonRoute ? <SelectHackathon /> : <SelectSponsor />}
            </Box>
          )}
          <CreateListingModal isOpen={isOpen} onClose={onClose} />
          <Flex align="center" justify="space-between" px={6} pb={6}>
            {!isHackathonRoute ? (
              <Tooltip
                label={
                  isCreateListingAllowed !== undefined &&
                  isCreateListingAllowed === false &&
                  session?.user.role !== 'GOD'
                    ? 'Creating a new listing has been temporarily locked for you since you have 5 listings which are “Rolling” or “In Review”. Please announce the winners for such listings to create new listings.'
                    : ''
                }
              >
                <Button
                  className="ph-no-capture"
                  w="full"
                  py={'22px'}
                  fontSize="md"
                  isDisabled={
                    isCreateListingAllowed !== undefined &&
                    isCreateListingAllowed === false &&
                    session?.user.role !== 'GOD'
                  }
                  leftIcon={<AddIcon w={3} h={3} />}
                  onClick={() => {
                    posthog.capture('create new listing_sponsor');
                    onOpen();
                  }}
                  variant="solid"
                >
                  Create New Listing
                  {isCreateListingAllowed !== undefined &&
                    isCreateListingAllowed === false &&
                    session?.user.role !== 'GOD' && <Icon as={LuLock} ml={2} />}
                </Button>
              </Tooltip>
            ) : (
              <Button
                as={NextLink}
                w="full"
                py={'22px'}
                fontSize="md"
                href={`/dashboard/hackathon/create-hackathon`}
                leftIcon={<AddIcon w={3} h={3} />}
                variant="solid"
              >
                Create New Track
              </Button>
            )}
          </Flex>
          {LinkItems.map((link) => (
            <NavItem
              onClick={() => {
                if (link.posthog) posthog.capture(link.posthog);
              }}
              className="ph-no-capture"
              key={link.name}
              link={link.link}
              icon={link.icon}
            >
              {link.name}
            </NavItem>
          ))}
        </Box>
        {showLoading && <LoadingSection />}
        {showContent && (
          <Box w="full" px={6} py={10} bg="white">
            {children}
          </Box>
        )}
      </Flex>
    </Default>
  );
}
