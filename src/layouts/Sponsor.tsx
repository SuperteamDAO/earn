import { useQuery } from '@tanstack/react-query';
import { Lock, Plus } from 'lucide-react';
import Link from 'next/link';
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
import { LuMessageSquare, LuUsers } from 'react-icons/lu';
import { MdList, MdOutlineChatBubbleOutline } from 'react-icons/md';
import { RiUserSettingsLine } from 'react-icons/ri';

import { EntityNameModal } from '@/components/modals/EntityNameModal';
import { FeatureModal } from '@/components/modals/FeatureModal';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Superteams } from '@/constants/Superteam';
import { PDTG } from '@/constants/Telegram';
import { useDisclosure } from '@/hooks/use-disclosure';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { Login } from '@/features/auth/components/Login';
import { isCreateListingAllowedQuery } from '@/features/listing-builder/queries/is-create-allowed';
import { CreateListingModal } from '@/features/sponsor-dashboard/components/CreateListingModal';
import { NavItem } from '@/features/sponsor-dashboard/components/NavItems';
import { SelectHackathon } from '@/features/sponsor-dashboard/components/SelectHackathon';
import { SelectSponsor } from '@/features/sponsor-dashboard/components/SelectSponsor';
import { SponsorInfoModal } from '@/features/sponsor-dashboard/components/SponsorInfoModal';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isSponsorInfoModalOpen,
    onOpen: onSponsorInfoModalOpen,
    onClose: onSponsorInfoModalClose,
  } = useDisclosure();
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

  const { data: isCreateListingAllowed } = useQuery(
    isCreateListingAllowedQuery,
  );

  const handleEntityClose = () => {
    setIsEntityModalOpen(false);
  };

  useEffect(() => {
    const modalsToShow = async () => {
      if (
        user?.currentSponsorId &&
        (!user?.firstName || !user?.lastName || !user?.username)
      ) {
        onSponsorInfoModalOpen();
      } else if (
        !user?.currentSponsor?.entityName &&
        session?.user.role !== 'GOD'
      ) {
        setIsEntityModalOpen(true);
      } else {
        setIsEntityModalOpen(false);
      }
    };
    modalsToShow();
  }, [user, session]);

  useEffect(() => {
    if (status === 'authenticated' && !user?.currentSponsorId) {
      router.push('/');
    }
  }, [user, status]);

  if (!session && status === 'loading') {
    return <LoadingSection />;
  }

  if (!session && status === 'unauthenticated') {
    return <Login hideCloseIcon isOpen={true} onClose={() => {}} />;
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
          link: PDTG,
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
      <FeatureModal isSponsorsRoute />
      <SponsorInfoModal
        onClose={onSponsorInfoModalClose}
        isOpen={isSponsorInfoModalOpen}
      />

      <EntityNameModal isOpen={isEntityModalOpen} onClose={handleEntityClose} />
      <div className="flex min-h-[80vh] px-3 md:hidden">
        <p className="pt-20 text-center text-xl font-medium text-slate-500">
          The Sponsor Dashboard on Earn is not optimized for mobile yet. Please
          use a desktop to check out the Sponsor Dashboard
        </p>
      </div>
      <div className="hidden min-h-screen justify-start md:flex">
        <div
          className={cn(
            'sponsor-dashboard-sidebar overflow-x-hidden whitespace-nowrap border-r border-slate-200 bg-white pt-5',
            'transition-all duration-300 ease-in-out',
            isCollapsible ? 'fixed' : 'static',
            isExpanded
              ? ['w-64 min-w-64 max-w-64', 'expanded']
              : ['w-20 min-w-20 max-w-20'],
            'bottom-0 left-0 top-12 z-10',
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {session?.user?.role === 'GOD' && (
            <div className={cn('pb-6', isExpanded ? 'pl-6 pr-4' : 'px-4')}>
              {isHackathonRoute ? (
                <SelectHackathon isExpanded={isExpanded} />
              ) : (
                <SelectSponsor isExpanded={isExpanded} />
              )}
            </div>
          )}
          <CreateListingModal isOpen={isOpen} onClose={onClose} />
          <div
            className={cn(
              'flex items-center justify-between px-4 pb-6',
              isExpanded ? 'pl-6 pr-4' : 'px-4',
            )}
          >
            {!isHackathonRoute ? (
              <Tooltip
                content={
                  "Creating a new listing has been temporarily locked for you since you have 5 listings which are 'In Review'. Please announce the winners for such listings to create new listings."
                }
                disabled={
                  !(
                    isCreateListingAllowed !== undefined &&
                    isCreateListingAllowed === false &&
                    session?.user.role !== 'GOD'
                  )
                }
              >
                <Button
                  className={cn(
                    'ph-no-capture py-5.5 w-full gap-2 text-base',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  disabled={
                    isCreateListingAllowed !== undefined &&
                    isCreateListingAllowed === false &&
                    session?.user.role !== 'GOD'
                  }
                  onClick={() => {
                    posthog.capture('create new listing_sponsor');
                    onOpen();
                  }}
                  variant="default"
                >
                  <Plus className="h-3 w-3" />
                  <p
                    className={cn(
                      'nav-item-text transition-all duration-200 ease-in-out',
                      isExpanded
                        ? ['static ml-0 opacity-100']
                        : ['absolute -ml-[9999px] opacity-0'],
                    )}
                  >
                    Create New Listing
                  </p>
                  {isCreateListingAllowed !== undefined &&
                    isCreateListingAllowed === false &&
                    session?.user.role !== 'GOD' && (
                      <Lock className="h-4 w-4" />
                    )}
                </Button>
              </Tooltip>
            ) : (
              <Button
                asChild
                className={cn('py-5.5 w-full gap-2 text-base')}
                variant="default"
              >
                <Link href="/dashboard/new/?type=hackathon">
                  <Plus className="h-3 w-3" />
                  <p
                    className={cn(
                      'nav-item-text transition-opacity duration-200 ease-in-out',
                      isExpanded
                        ? ['static ml-0 opacity-100']
                        : ['absolute -ml-[9999px] opacity-0'],
                    )}
                  >
                    Create New Track
                  </p>
                </Link>
              </Button>
            )}
          </div>
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
        </div>
        {showLoading && <LoadingSection />}
        {showContent && (
          <div
            className={cn(
              'w-full flex-1 bg-white py-5 pl-4 pr-8 transition-[margin-left] duration-300 ease-in-out',
              isCollapsible ? 'ml-20' : 'ml-0',
            )}
          >
            {children}
          </div>
        )}
      </div>
    </Default>
  );
}
