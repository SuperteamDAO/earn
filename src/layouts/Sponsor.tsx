import { AddIcon, CheckIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
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
import { PDTG } from '@/constants';
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
  const [isLoading, setIsLoading] = useState(false);
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
    data: isCreateListingAllowedResponse,
    refetch: isCreateListingAllowedRefetch,
  } = useQuery(isCreateListingAllowedQuery);

  const isCreateListingAllowed = isCreateListingAllowedResponse?.allowed;
  const [isSponsorActive, setIsSponsorActive] = useState(false);
  useEffect(() => {
    if (isCreateListingAllowedResponse?.isActive === true) {
      setIsSponsorActive(true);
    } else {
      setIsSponsorActive(false);
    }
  }, [isCreateListingAllowedResponse]);

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
        name: '获取帮助',
        link: PDTG,
        icon: MdOutlineChatBubbleOutline,
        posthog: 'get help_sponsor',
      },
    ]
    : [
      { name: '我的任务列表', link: '/listings', icon: BiListUl },
      {
        name: '团队设置',
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
        name: '获取帮助',
        link: PDTG,
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

  // 从环境变量 EARN_GOD_EMAIL 获取管理员邮件地址
  const godEmail = process.env.NEXT_PUBLIC_EARN_GOD_EMAIL;
  const godTelegram = process.env.NEXT_PUBLIC_EARN_GOD_TELEGRAM;
  const godTelegramLink = `https://t.me/${godTelegram}`;

  // activate sponsor
  const activateSponsor = async () => {
    setIsLoading(true);
    try {
      await axios.post('/api/sponsors/activate', {
        userId: session?.user.id,
        sponsorId: user?.currentSponsorId,
      });
      // isSponsorActive = true;
      setIsSponsorActive(true);
    } catch (error: any) {
      console.error('Error activating sponsor:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cannotCreateNewListing =
    isCreateListingAllowed !== undefined &&
    isCreateListingAllowed === false &&
    session?.user.role !== 'GOD';

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Solar Earn | Work to Earn in Crypto"
          description="Explore the latest bounties on Solar Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical=""
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
          <CreateListingModal
            isOpen={isOpen}
            onClose={onClose}
            cannotCreateNewListing={cannotCreateNewListing}
          />
          <Flex align="center" justify="space-between" px={4} pb={6}>
            {!isHackathonRoute ? (
              <Tooltip
                label={
                  cannotCreateNewListing
                    ? isSponsorActive
                      ? 'Creating a new listing has been temporarily locked for you since you have 5 listings which are “Rolling” or “In Review”. Please announce the winners for such listings to create new listings.'
                      : '发送邮件至 abc@solar.com 或者Telegrem @abc，联系管理员，开启相关权限'
                    : ''
                }
              >
                <Button
                  className="ph-no-capture"
                  gap={2}
                  w="full"
                  py={'22px'}
                  fontSize="md"
                  isDisabled={cannotCreateNewListing}
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
                    创建新任务
                  </Text>
                  {cannotCreateNewListing && <Icon as={LuLock} />}
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
                  创建新 Track
                </Text>
              </Button>
            )}
          </Flex>
          {session?.user.role === 'GOD' && (
            <Flex align="center" justify="space-between" px={4} pb={6}>
              <Button
                className="ph-no-capture"
                gap={2}
                w="full"
                py={'22px'}
                fontSize="md"
                isDisabled={isSponsorActive === true || isLoading}
                isLoading={isLoading}
                loadingText="Activating..."
                onClick={activateSponsor}
                variant="solid"
              >
                <CheckIcon w={3} h={3} />
                <Text
                  className="nav-item-text"
                  pos={isExpanded ? 'static' : 'absolute'}
                  ml={isExpanded ? 0 : '-9999px'}
                  opacity={isExpanded ? 1 : 0}
                  transition="all 0.2s ease-in-out"
                >
                  激活项目方
                </Text>
              </Button>
            </Flex>
          )}

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
