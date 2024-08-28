import { AddIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { IconType } from 'react-icons';
import { BiListUl } from 'react-icons/bi';
import { LuLock, LuMessageSquare, LuUsers } from 'react-icons/lu';
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
  latestActiveSlugQuery,
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

export function SponsorLayout({
  children,
  isCollapsible = false,
}: {
  children: ReactNode;
  isCollapsible?: boolean;
}) {
  const { user } = useUser();
  const updateUser = useUpdateUser();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const posthog = usePostHog();
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const { query } = router;
  const [isExpanded, setIsExpanded] = useState(!isCollapsible ? true : false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (!isCollapsible) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, 250);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isCollapsible) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsExpanded(false);
  }, []);

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

  const {
    isOpen: isScoutAnnounceModalOpen,
    onOpen: onScoutAnnounceModalOpen,
    onClose: onScoutAnnounceModalClose,
  } = useDisclosure();

  const { data: latestActiveSlug } = useQuery(
    latestActiveSlugQuery(!!user?.currentSponsorId),
  );

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
  const isLocalMemberVisible = Superteams.some(
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
        { name: 'My Listings', link: '/listings', icon: BiListUl },
        {
          name: 'Team Settings',
          link: '/team-settings',
          icon: RiUserSettingsLine,
        },
        ...(isLocalMemberVisible
          ? [
              {
                name: 'Local Members',
                link: '/local-members',
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
        latestActiveBountySlug={latestActiveSlug}
        onClose={onScoutAnnounceModalClose}
        isOpen={isScoutAnnounceModalOpen}
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
          className={`sponsor-dashboard-sidebar ${isExpanded ? 'expanded' : ''}`}
          pos={isCollapsible ? 'fixed' : 'static'}
          zIndex={10}
          top={8}
          bottom={0}
          left={0}
          overflowX="hidden"
          w={isExpanded ? '18rem' : '5rem'}
          minW={isExpanded ? '18rem' : '5rem'}
          maxW={isExpanded ? '18rem' : '5rem'}
          pt={10}
          bg="white"
          borderRight={'1px solid'}
          borderRightColor={'blackAlpha.200'}
          whiteSpace="nowrap"
          transition="all 0.3s ease-in-out"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {session?.user?.role === 'GOD' && (
            <Box px={4} pb={6}>
              {isHackathonRoute ? (
                <SelectHackathon isExpanded={isExpanded} />
              ) : (
                <SelectSponsor isExpanded={isExpanded} />
              )}
            </Box>
          )}
          <CreateListingModal isOpen={isOpen} onClose={onClose} />
          <Flex align="center" justify="space-between" px={4} pb={6}>
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
                  gap={2}
                  w="full"
                  py={'22px'}
                  fontSize="md"
                  isDisabled={
                    isCreateListingAllowed !== undefined &&
                    isCreateListingAllowed === false &&
                    session?.user.role !== 'GOD'
                  }
                  onClick={() => {
                    posthog.capture('create new listing_sponsor');
                    onOpen();
                  }}
                  variant="solid"
                >
                  <AddIcon w={3} h={3} />
                  <Text
                    className="nav-item-text"
                    pos={isExpanded ? 'static' : 'absolute'}
                    ml={isExpanded ? 0 : '-9999px'}
                    opacity={isExpanded ? 1 : 0}
                    transition="all 0.2s ease-in-out"
                  >
                    Create New Listing
                  </Text>
                  {isCreateListingAllowed !== undefined &&
                    isCreateListingAllowed === false &&
                    session?.user.role !== 'GOD' && <Icon as={LuLock} />}
                </Button>
              </Tooltip>
            ) : (
              <Button
                as={NextLink}
                gap={2}
                w="full"
                py={'22px'}
                fontSize="md"
                href={`/dashboard/hackathon/create-hackathon`}
                variant="solid"
              >
                <AddIcon w={3} h={3} />
                <Text
                  className="nav-item-text"
                  pos={isExpanded ? 'static' : 'absolute'}
                  ml={isExpanded ? 0 : '-9999px'}
                  opacity={isExpanded ? 1 : 0}
                  transition="opacity 0.2s ease-in-out"
                >
                  Create New Track
                </Text>
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
              isExpanded={isExpanded}
            >
              {link.name}
            </NavItem>
          ))}
        </Box>
        {showLoading && <LoadingSection />}
        {showContent && (
          <Box
            flex={1}
            w="full"
            ml={isCollapsible ? '80px' : '0px'}
            px={6}
            py={10}
            bg="white"
            transition="margin-left 0.3s ease-in-out"
          >
            {children}
          </Box>
        )}
      </Flex>
    </Default>
  );
}
