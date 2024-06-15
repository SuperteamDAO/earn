import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import { type BountyType } from '@prisma/client';
import type { GetServerSideProps, NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';

import { InstallPWAModal } from '@/components/modals/InstallPWAModal';
import { EmptySection } from '@/components/shared/EmptySection';
import { type Grant, GrantsCard } from '@/features/grants';
import { type Bounty, ListingSection, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { userStore } from '@/store/user';

import { getListings, type Skills, type Status } from './api/listings/v2';

interface Props {
  bounties: Bounty[];
  grants: Grant[];
}

const HomePage: NextPage<Props> = ({ bounties, grants }) => {
  // const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [mobileOs, setMobileOs] = useState<'Android' | 'iOS' | 'Other'>(
    'Other',
  );
  // const [bounties, setBounties] = useState<{ bounties: Listing[] }>({
  //   bounties: [],
  // });
  // const [grants, setGrants] = useState<{ grants: GrantWithApplicationCount[] }>(
  //   {
  //     grants: [],
  //   },
  // );
  const installPrompt = useRef<BeforeInstallPromptEvent | null>();
  // const date = dayjs().subtract(1, 'month').toISOString();

  // const getListings = async () => {
  //   setIsListingsLoading(true);
  //   try {
  //     const bountyData = await axios.get('/api/listings/', {
  //       params: {
  //         category: 'bounties',
  //         take: 100,
  //         deadline: date,
  //         isHomePage: true,
  //       },
  //     });
  //
  //     setBounties(bountyData.data);
  //     setIsListingsLoading(false);
  //
  //     const grantsData = await axios.get('/api/listings/', {
  //       params: {
  //         category: 'grants',
  //       },
  //     });
  //
  //     setGrants(grantsData.data);
  //   } catch (e) {
  //     console.log(e);
  //
  //     setIsListingsLoading(false);
  //   }
  // };

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', ((
      e: BeforeInstallPromptEvent,
    ) => {
      e.preventDefault();
      installPrompt.current = e;
    }) as EventListener);

    // if (!isListingsLoading) return;
    // getListings();
  }, []);

  const { userInfo } = userStore();

  const {
    isOpen: isPWAModalOpen,
    onClose: onPWAModalClose,
    onOpen: onPWAModalOpen,
  } = useDisclosure();

  const getMobileOS = () => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      return 'Android';
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      return 'iOS';
    }
    return 'Other';
  };

  useEffect(() => {
    const showInstallAppModal = () => {
      const modalShown = localStorage.getItem('installAppModalShown');
      const navigator: any = window.navigator;

      const isPWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        document.referrer.includes('android-app://') ||
        navigator.standalone;
      const isInstalled = localStorage.getItem('isAppInstalled');
      const os = getMobileOS();
      setMobileOs(os);
      if (os !== 'Other' && !isPWA && !modalShown && !isInstalled) {
        localStorage.setItem('installAppModalShown', 'true');
        onPWAModalOpen();
      }
    };

    setTimeout(() => {
      showInstallAppModal();
    }, 10000);
  }, [userInfo]);

  const installApp = async () => {
    if (installPrompt.current) {
      const status = await installPrompt.current?.prompt();
      if (status.outcome === 'accepted') {
        localStorage.setItem('isAppInstalled', 'true');
      }
    }
    onPWAModalClose();
  };

  return (
    <Home type="home">
      <InstallPWAModal
        isOpen={isPWAModalOpen}
        onClose={onPWAModalClose}
        installApp={installApp}
        mobileOs={mobileOs}
      />
      <Box w={'100%'}>
        <ListingTabs
          bounties={bounties}
          isListingsLoading={false}
          emoji="/assets/home/emojis/moneyman.png"
          title="Freelance Gigs"
          viewAllLink="/all"
          take={20}
          showViewAll
          checkLanguage
        />
        <ListingSection
          type="grants"
          title="Grants"
          sub="Equity-free funding opportunities for builders"
          emoji="/assets/home/emojis/grants.png"
          showViewAll
        >
          {/* {isListingsLoading && ( */}
          {/*   <Flex align="center" justify="center" direction="column" minH={52}> */}
          {/*     <Loading /> */}
          {/*   </Flex> */}
          {/* )} */}
          {!grants?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No grants available!"
                message="Subscribe to notifications to get notified about new grants."
              />
            </Flex>
          )}
          {grants &&
            grants?.map((grant) => {
              return <GrantsCard grant={grant} key={grant.id} />;
            })}
        </ListingSection>
      </Box>
    </Home>
  );
};

export default HomePage;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const params = context.query;

  const category = params.category as string | undefined;
  const order = (params.order as 'asc' | 'desc') ?? 'asc';
  const isHomePage = params.isHomePage === 'true';

  const skillFilter = params.skill as Skills | undefined;
  const statusFilter: Status = (params.status as Status) ?? 'open';
  const type = params.type as BountyType | undefined;
  const take = params.take ? parseInt(params.take as string, 20) : 20;
  // const deadline = params.deadline as string | undefined;

  console.log('status - ', statusFilter);

  const openResult = await getListings({
    category,
    order,
    isHomePage,
    skillFilter,
    statusFilter: 'open',
    type,
    take,
  });

  const reviewResult = await getListings({
    category: 'bounties',
    order: 'desc',
    isHomePage,
    skillFilter,
    statusFilter: 'review',
    type,
    take,
  });

  const completeResult = await getListings({
    category: 'bounties',
    order: 'desc',
    isHomePage,
    skillFilter,
    statusFilter: 'completed',
    type,
    take,
  });

  const result: {
    bounties: Bounty[];
    grants: Grant[];
  } = {
    bounties: [
      ...openResult.bounties,
      ...reviewResult.bounties,
      ...completeResult.bounties,
    ],
    grants: openResult.grants,
  };

  console.log('bounties length', result.bounties.length);

  return {
    props: JSON.parse(JSON.stringify(result)),
  };
};
