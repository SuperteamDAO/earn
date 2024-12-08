import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  Tooltip,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { type SubscribeHackathon } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useRef, useState } from 'react';
import Countdown from 'react-countdown';
import { FaPlay } from 'react-icons/fa';
import { FaDiscord } from 'react-icons/fa6';
import { TbBell, TbBellRinging } from 'react-icons/tb';
import { toast } from 'sonner';

import { UserFlag } from '@/components/shared/UserFlag';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { LocalImage } from '@/components/ui/local-image';
import { Superteams } from '@/constants/Superteam';
import { tokenList } from '@/constants/tokenList';
import { AuthWrapper } from '@/features/auth';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';
import { TalentOlympicsHeader } from '@/svg/talent-olympics-header';
import { dayjs } from '@/utils/dayjs';

const SLUG = 'talent-olympics';

const base = `/hackathon/talent-olympics/`;
const baseAsset = (filename: string) => base + filename;

const slugLink = (slug: string) => `/listings/hackathon/${slug}`;

const frontendTrack: TrackProps[] = [
  {
    icon: baseAsset('scan.svg'),
    title: 'New Wallet with Swap Functionality',
    description:
      'Create a wallet with the best-in-class integration and swapping experience.',
    amount: 1000,
    token: 'USDC',
    link: slugLink(
      'new-wallet-design-and-swap-functionality-st-talent-olympics',
    ),
  },
  {
    icon: baseAsset('laptop.svg'),
    title: 'Escrow UI + Blink  ',
    description: 'Create a user-friendly escrow UI and a Blink for it.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('escrow-ui-blink-st-talent-olympics'),
  },
  {
    icon: baseAsset('cube.svg'),
    title: 'Oracle Aggregator',

    description:
      'Display Oracle data using multiple sources for a DeFi application.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('oracle-aggregator-st-talent-olympics'),
  },
  {
    icon: baseAsset('cube2.svg'),
    title: 'Tooling Data Explorer/Dashboard',
    description:
      'Make an explorer or dashboard that fetches data from RPC/API sources.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('tooling-data-explorerdashboard-st-talent-olympics'),
  },
  {
    icon: baseAsset('code.svg'),
    title: 'Create a Marketplace UI',
    description:
      'Design and develop a creative marketplace UI using the given smart contract repo.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('create-a-marketplace-ui-st-talent-olympics'),
  },
];

const rustTrack: TrackProps[] = [
  {
    icon: baseAsset('monitor.svg'),
    title: 'NFT Mint, Vault & Swap',
    description: 'Create an Anchor program that can mint, vault and swap NFTs.',
    amount: 1000,
    token: 'USDC',
    link: slugLink(
      'nft-creation-and-vault-integration-with-anchor-st-talent-olympics',
    ),
  },
  {
    icon: baseAsset('git.svg'),
    title: 'DAO Voting Program',
    description:
      'Develop a DAO voting program that displays results, using Anchor.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('dao-voting-program-st-talent-olympics'),
  },
  {
    icon: baseAsset('filegit.svg'),
    title: 'Prediction Market & Blink for Memecoins',
    description:
      'Create a prediction marketplace (binary option model) for SPL memecoin prices.',
    amount: 1000,
    token: 'USDC',
    link: slugLink(
      'prediction-market-and-blink-for-memecoins-st-talent-olympics',
    ),
  },
  {
    icon: baseAsset('book.svg'),
    title: 'Whitelist-gated Token Sale',
    description:
      'Using Native Rust or Anchor, create a whitelist-gated token airdrop.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('whitelist-gated-token-sale-st-talent-olympics'),
  },
  {
    icon: baseAsset('bookmark.svg'),
    title: 'Two-sided Marketplace for Services',
    description:
      'Create a 2-sided marketplace model for services using Anchor or Rust.',
    amount: 1000,
    token: 'USDC',
    link: slugLink('two-sided-marketplace-for-services-st-talent-olympics'),
  },
];

interface Props {
  countryLeaders: CountryLeader[];
  rankings: { user: User; rating: number }[];
}

export default function TalentOlympics({ countryLeaders, rankings }: Props) {
  const PADX = 4;
  const START_DATE = '2024-07-10T23:59:59Z';
  const CLOSE_DATE = '2024-07-14T23:59:59Z';

  const [hackathonIsOn, setHackathonIsOn] = useState(false);
  useEffect(() => {
    const hackathonStartTime = dayjs(START_DATE);

    const checkHackathonStatus = () => {
      const now = dayjs.utc();
      if (now.isAfter(hackathonStartTime)) {
        setHackathonIsOn(true);
      }
    };

    checkHackathonStatus();

    const intervalId = setInterval(checkHackathonStatus, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Default
      className="bg-white"
      meta={
        <Meta
          title="Talent Olympics | Superteam Earn"
          description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          canonical="https://earn.superteam.fun"
        />
      }
    >
      <div>
        <Hero START_DATE={START_DATE} CLOSE_DATE={CLOSE_DATE} />
        <Box overflowX="hidden" maxW="7xl" mx="auto" px={PADX}>
          <GetHiredBy />
        </Box>
        <Divider borderColor="brand.slate.300" />
        <Box overflowX="hidden" maxW="7xl" mx="auto" px={PADX}>
          <About />
        </Box>
        <Box pos="relative" w="full" px={PADX} py={8} bg="#F8FAFC">
          <Text
            pos="absolute"
            zIndex={0}
            top={'8rem'}
            display={{ base: 'none', md: 'block' }}
            color="brand.slate.300"
            fontSize="7xl"
            fontWeight={700}
            transform={'rotate(-90deg)'}
          >
            Tracks
          </Text>
          <Flex
            pos="relative"
            zIndex={1}
            justify={'center'}
            direction={{ base: 'column', md: 'row' }}
            gap={8}
            overflowX="hidden"
            maxW="7xl"
            mx="auto"
          >
            <Track
              title="Front End Track"
              tracks={frontendTrack}
              hackathonIsOn={hackathonIsOn}
            />
            <Track
              title="Rust Track"
              tracks={rustTrack}
              hackathonIsOn={hackathonIsOn}
            />
          </Flex>
        </Box>
        <Box overflowX="hidden" maxW="7xl" mx="auto" px={PADX}>
          {hackathonIsOn && <Leaderboard leaders={countryLeaders} />}
          <Rankings rankings={rankings} />
          <FAQs />
        </Box>
      </div>
    </Default>
  );
}

function Hero({
  START_DATE,
  CLOSE_DATE,
}: {
  START_DATE: string;
  CLOSE_DATE: string;
}) {
  const PoweredByHeight = '2.5rem';
  const isSM = useBreakpointValue({ base: false, sm: true });
  const isMD = useBreakpointValue({ base: false, md: true });

  const [countdownDate, setCountdownDate] = useState<Date>(
    dayjs.utc(START_DATE).toDate(),
  );
  const [status, setStatus] = useState<'Open In' | 'Close In' | 'Closed'>(
    'Open In',
  );

  useEffect(() => {
    function updateStatus() {
      if (dayjs().isAfter(CLOSE_DATE)) {
        setStatus('Closed');
      } else if (dayjs().isAfter(START_DATE)) {
        setCountdownDate(dayjs.utc(CLOSE_DATE).toDate());
        setStatus('Close In');
      }
    }

    const intervalId = setInterval(updateStatus, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Flex
      align="center"
      direction={'column'}
      pt={'3rem'}
      pb={'1rem'}
      bgImage={`url('${base}bg.png')`}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      borderColor={'brand.slate.200'}
      borderBottomWidth={'1px'}
    >
      <TalentOlympicsHeader
        styles={{ height: isSM ? '12rem' : '12rem', width: 'auto' }}
      />
      <Text
        maxW="sm"
        mt={4}
        px={6}
        color="white"
        fontWeight={500}
        textAlign={'center'}
      >
        Complete Challenges. Earn Prizes. <br /> Get a Full-Time Job.
      </Text>
      <Flex
        align="center"
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 3, sm: 6 }}
        mt={6}
        mb={1}
      >
        <Flex gap={5} w={{ base: 'full', md: 'auto' }}>
          <Button
            as={NextLink}
            gap={2}
            w={{ base: 'full', md: 'auto' }}
            px={6}
            color="white"
            fontSize={'sm'}
            bg="#6366F1"
            _active={{ bg: '#6366D1' }}
            href="https://discord.gg/5agsprjsj4"
            rounded="full"
            target="_blank"
          >
            <FaDiscord style={{ width: '1.2rem', height: '1.2rem' }} />
            Join Discord
          </Button>

          {!isMD && <SubscribeHackathon />}
        </Flex>
        <Button
          alignItems="center"
          gap={2}
          w={{ base: 'full', md: 'auto' }}
          px={6}
          color={status === 'Close In' ? '#39FFC1' : 'brand.slate.200'}
          fontSize={'sm'}
          bg="rgba(0, 0, 0, 0.4)"
          pointerEvents={'none'}
          rounded="full"
        >
          <Circle
            bg={status === 'Close In' ? '#39FFC1' : 'brand.slate.200'}
            size={1.5}
          />
          <Text fontWeight={500}>
            Submissions {status}{' '}
            {status !== 'Closed' && (
              <Countdown
                date={countdownDate}
                renderer={CountDownRenderer}
                zeroPadDays={1}
              />
            )}
          </Text>
        </Button>
        {isMD && <SubscribeHackathon />}
      </Flex>
      <Text mt={4} color="white" fontSize={'9px'}>
        POWERED BY
      </Text>
      <Flex align="center" gap={8} my={4}>
        <ExternalImage
          style={{ height: PoweredByHeight }}
          alt="Web3 Builders Alliance"
          src={'/company-logos/turbine.svg'}
          className="w-[5rem] sm:w-[7rem]"
        />
        <ExternalImage
          className="w-[5rem] sm:w-[7rem]"
          alt="Superteam"
          src={'/company-logos/superteam.svg'}
          style={{ height: PoweredByHeight }}
        />
        <ExternalImage
          className="w-[5rem] sm:w-[7rem]"
          alt="Rise In"
          src={'/company-logos/rise-in.svg'}
          style={{ height: PoweredByHeight }}
        />
      </Flex>
    </Flex>
  );
}

function GetHiredBy() {
  const base = '/company-logos/';
  const baseAsset = (filename: string) => base + filename;

  const hiredBy: { name: string; src: string }[] = [
    {
      name: 'Mirron World',
      src: baseAsset('mirror-world.svg'),
    },
    {
      name: 'Pyth',
      src: baseAsset('pyth2.svg'),
    },
    {
      name: 'Rise In',
      src: baseAsset('rise-in-dark.svg'),
    },
    {
      name: 'Metawealth',
      src: baseAsset('metawealth.png'),
    },
    {
      name: 'Galxe',
      src: baseAsset('galxe.svg'),
    },
    {
      name: 'Sanctum',
      src: baseAsset('sanctum.svg'),
    },
    {
      name: 'Tensor',
      src: baseAsset('tensor.svg'),
    },
    {
      name: 'Metaplex',
      src: baseAsset('metaplex.svg'),
    },
    {
      name: 'Helio',
      src: baseAsset('helio.svg'),
    },
    {
      name: 'Helius',
      src: baseAsset('helius.svg'),
    },
    {
      name: 'Flash Trade',
      src: baseAsset('flash-trade.svg'),
    },
    {
      name: 'Jito Labs',
      src: baseAsset('jito-labs.svg'),
    },
    {
      name: 'Khiza',
      src: baseAsset('khiza.svg'),
    },
    {
      name: 'Open Book',
      src: baseAsset('open-book.svg'),
    },
    {
      name: 'Orca',
      src: baseAsset('orca.svg'),
    },
    {
      name: 'Drift',
      src: baseAsset('drift.svg'),
    },
    {
      name: 'Squads',
      src: baseAsset('squads.svg'),
    },
    {
      name: 'Mango Markets',
      src: baseAsset('mango-markets.svg'),
    },
    {
      name: 'Kamino',
      src: baseAsset('kamino.svg'),
    },
    {
      name: 'Solana Beach',
      src: baseAsset('solana-beach.svg'),
    },
    {
      name: 'Turbine',
      src: baseAsset('turbine2.svg'),
    },
    {
      name: 'Iron',
      src: baseAsset('iron.svg'),
    },
    {
      name: 'Bandit Network',
      src: baseAsset('bandit-network.svg'),
    },
    {
      name: 'Trustless Engineering',
      src: baseAsset('trustless-engineering.svg'),
    },
    {
      name: 'Bonk',
      src: baseAsset('bonk.png'),
    },
    {
      name: 'MH Ventures',
      src: baseAsset('mh-ventures.svg'),
    },
    {
      name: 'Meta Pool',
      src: baseAsset('metapool.svg'),
    },
    {
      name: 'Prism',
      src: baseAsset('prism.svg'),
    },
    {
      name: 'Neo Nomad',
      src: baseAsset('neonomad.svg'),
    },
    {
      name: 'Linum Labs',
      src: baseAsset('linumlabs.svg'),
    },
    {
      name: 'Truther',
      src: baseAsset('truther.svg'),
    },
    {
      name: 'Infratoken',
      src: baseAsset('infratoken.svg'),
    },
    {
      name: 'One Percent',
      src: baseAsset('onepercent.svg'),
    },
    {
      name: 'Bitfinex',
      src: baseAsset('bitfinex.svg'),
    },
    {
      name: 'Dabba',
      src: baseAsset('dabba.svg'),
    },
    {
      name: 'Proto',
      src: baseAsset('proto.svg'),
    },
    {
      name: 'someraw2',
      src: baseAsset('someraw2.svg'),
    },
    {
      name: 'Transfero',
      src: baseAsset('transfero.svg'),
    },
    {
      name: 'Jungle',
      src: baseAsset('jungle.svg'),
    },
    {
      name: 'Moby',
      src: baseAsset('moby.svg'),
    },
    {
      name: 'Backpack',
      src: baseAsset('backpack.svg'),
    },
    {
      name: 'MobiUp',
      src: baseAsset('mobiup.svg'),
    },
    {
      name: 'Ripio',
      src: baseAsset('ripio.svg'),
    },
    {
      name: 'Parcl',
      src: baseAsset('parcl.svg'),
    },
    {
      name: 'Staking Facilities',
      src: baseAsset('staking-facilities.svg'),
    },
    {
      name: 'DeCharge',
      src: baseAsset('decharge.svg'),
    },
    {
      name: 'Solana ID',
      src: baseAsset('solana-id.svg'),
    },
    {
      name: 'Light Protocol',
      src: baseAsset('light-protocol.svg'),
    },
    {
      name: 'Sonar Watch',
      src: baseAsset('sonar-watch.svg'),
    },
  ];

  const multipliedHiredBy = [
    ...hiredBy,
    ...hiredBy,
    ...hiredBy,
    ...hiredBy,
    ...hiredBy,
  ];

  return (
    <Flex align="center" gap={{ base: 4, md: 8 }} w="full" py={6}>
      <Box display="block" minW={'5rem'} color="brand.slate.400">
        Get Hired <br /> By{' '}
      </Box>
      <Box minW={0}>
        <Marquee speed={100}>
          {multipliedHiredBy.map((h, index) => (
            <ExternalImage
              className="mx-4 inline-block h-8"
              key={`${h.name}-${index}`}
              alt={h.name}
              src={h.src}
            />
          ))}
        </Marquee>
      </Box>
    </Flex>
  );
}

function About() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Grid
      gap={{ base: 8, md: 12 }}
      templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
      my={8}
    >
      <KashModal isOpen={isOpen} onClose={onClose} />
      <GridItem>
        <VStack align="start" gap={4}>
          <Text fontSize={'xl'} fontWeight={700}>
            Get Hired Based on Your Proof of Work
          </Text>
          <Text color="brand.slate.500">
            The Talent Olympics is designed to help talented developers from
            around the world get jobs at the best companies on Solana. To enter,
            simply complete the developer challenges below. Each challenge has a
            prize pool for the best submissions, and the participants with the
            most points globally will split an additional $10,000 prize pool and
            receive interviews with our hiring partners.
          </Text>
          <Button
            gap={2}
            px={3}
            py={2}
            bg="#F8FAFC"
            _hover={{ bg: 'brand.slate.200' }}
            onClick={onOpen}
            rounded="full"
          >
            <ExternalImage
              alt="kash"
              src={base + 'kash.png'}
              style={{ width: '1.5rem', height: '1.5rem' }}
            />
            <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
              Message from Kash
            </Text>
            <FaPlay
              color="#1B0341"
              style={{ width: '0.7rem', height: '0.7rem' }}
            />
          </Button>
        </VStack>
      </GridItem>
      <GridItem>
        <Grid
          gap={4}
          templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
        >
          <GridItem>
            <FeatureCard
              image={base + 'trophy.png'}
              title="45 Companies Hiring"
              description="at the Talent Olympics"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={base + 'cashbag.png'}
              title="$20,000 USDC"
              description="as cash prizes for the best submissions"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={base + 'coder.png'}
              title="Front End & Rust Tracks"
              description="with multiple challenges"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={base + 'winflag.png'}
              title="Ten Challenges"
              description="to prove you're the best candidate"
            />
          </GridItem>
        </Grid>
      </GridItem>
    </Grid>
  );
}

function FeatureCard({
  image,
  title,
  description,
}: {
  image: string;
  title: string;
  description: string;
}) {
  return (
    <HStack
      gap={4}
      p={4}
      borderWidth="1px"
      borderColor="brand.slate.200"
      rounded="lg"
    >
      <ExternalImage alt={title} src={image} />
      <VStack align={'start'} gap={0}>
        <Text fontWeight={600}>{title}</Text>
        <Text color="brand.slate.500" fontSize="xs" fontWeight={500}>
          {description}
        </Text>
      </VStack>
    </HStack>
  );
}

interface TrackProps {
  icon: string;
  title: string;
  description: string;
  token: string;
  amount: number;
  link: string;
  hackathonIsOn?: boolean;
}

function Track({
  title,
  tracks,
  hackathonIsOn,
}: {
  title: string;
  tracks: TrackProps[];
  hackathonIsOn: boolean;
}) {
  return (
    <VStack align="start" gap={6} mx={{ base: 'auto', md: '0' }}>
      <Text color="brand.slate.900" fontSize="lg" fontWeight={700}>
        {title}
      </Text>
      <VStack gap={4}>
        {tracks.map((t) => (
          <TrackBox key={t.title} {...t} hackathonIsOn={hackathonIsOn} />
        ))}
      </VStack>
    </VStack>
  );
}

function TrackBox({
  icon,
  title,
  description,
  amount,
  token,
  link,
  hackathonIsOn,
}: TrackProps) {
  return (
    <Tooltip label={hackathonIsOn ? '' : 'Details to be revealed on July 11.'}>
      <div className="w-full">
        <Link
          as={NextLink}
          w="full"
          _hover={{ textDecoration: 'none' }}
          pointerEvents={hackathonIsOn ? 'auto' : 'none'}
          href={link}
        >
          <Box
            w="full"
            maxW="lg"
            p={{ base: 3, md: 4 }}
            bg="white"
            borderWidth={'1px'}
            borderColor="brand.slate.200"
            borderRadius={8}
            cursor={hackathonIsOn ? 'pointer' : 'not-allowed'}
          >
            <Flex
              align="center"
              gap={5}
              _hover={{ textDecoration: 'underline' }}
            >
              <ExternalImage
                className="h-12 w-12 rounded-md object-cover md:h-[4.5rem] md:w-[4.5rem]"
                alt={title}
                src={icon}
              />
              <Flex direction={'column'}>
                <Text
                  color={'brand.slate.900'}
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontWeight={600}
                >
                  <TextStyler text={title} />
                </Text>
                <Text
                  color={'brand.slate.500'}
                  fontSize={{ base: 'sm', md: 'md' }}
                  textOverflow={'ellipsis'}
                  noOfLines={2}
                >
                  <TextStyler text={description} />
                </Text>
              </Flex>
            </Flex>
            <Flex align="center" justify={'end'} gap={1} mt={3}>
              <LocalImage
                className="h-4 w-4 rounded-full md:h-6 md:w-6"
                alt={token}
                src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
              />
              <Text
                color={'brand.slate.700'}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={600}
              >
                {amount?.toLocaleString('en-us')}
              </Text>
              <Text
                color={'brand.slate.400'}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={600}
                textDecoration={'none'}
                _hover={{ textDecoration: 'none' }}
              >
                {token}
              </Text>
            </Flex>
          </Box>
        </Link>
      </div>
    </Tooltip>
  );
}

function Leaderboard({ leaders }: { leaders: CountryLeader[] }) {
  return (
    <VStack gap={8} w="full" mx="auto" py={8}>
      <Text color="brand.slate.600" fontSize="xl" fontWeight={700}>
        Top Countries by Submissions
      </Text>
      <Grid
        rowGap={6}
        columnGap={24}
        autoFlow={'column'}
        templateRows={{ base: 'repeat(10, 1fr)', md: 'repeat(5, 1fr)' }}
        w="full"
        maxW="35rem"
      >
        {leaders.map((l, i) => (
          <HStack key={l.location} w="full">
            <HStack fontWeight={500}>
              <Text color="brand.slate.400">{i + 1}.</Text>
              <UserFlag location={l.location} />
              <Text
                maxW="12rem"
                color="brand.slate.500"
                textOverflow="ellipsis"
                noOfLines={1}
              >
                {l.location}
              </Text>
            </HStack>
            <Text ml="auto" fontWeight={500}>
              {l.submission_count === 0 ? '-' : l.submission_count}
            </Text>
          </HStack>
        ))}
      </Grid>
    </VStack>
  );
}

function Rankings({
  rankings,
}: {
  rankings: { user: User; rating: number }[];
}) {
  return (
    <VStack gap={8} display="none" w="full" mx="auto" py={8}>
      <Text color="brand.slate.600" fontSize="xl" fontWeight={700}>
        Top Individuals by Rating
      </Text>
      <Grid
        rowGap={6}
        columnGap={12}
        autoFlow={'column'}
        templateRows={{ base: 'repeat(10, 1fr)', md: 'repeat(5, 1fr)' }}
        w="full"
        maxW="35rem"
      >
        {rankings.map((r, i) => (
          <HStack key={r.user.id} justify="space-between" w="full">
            <HStack color="brand.slate.500" fontSize="xs" fontWeight={500}>
              <Text color="brand.slate.400">#{i + 1}</Text>
              <Link
                className="ph-no-capture"
                as={NextLink}
                alignItems="center"
                gap={2}
                display="flex"
                href={`/t/${r.user.username}`}
                target="_blank"
              >
                <Avatar w={8} h={8} src={r.user.photo ?? undefined} />
                <VStack
                  align="start"
                  justify={{ base: 'center', md: 'start' }}
                  gap={1}
                  lineHeight={{ base: 'normal', md: 1.15 }}
                >
                  <div className="flex items-center gap-2">
                    <Text
                      overflowX="hidden"
                      maxW={'7rem'}
                      color="black"
                      textOverflow={'ellipsis'}
                      noOfLines={1}
                    >
                      {r.user.firstName} {r.user.lastName}
                    </Text>
                  </div>
                  <Text
                    overflowX="hidden"
                    maxW={'7rem'}
                    textOverflow={'ellipsis'}
                    noOfLines={1}
                  >
                    @{r.user.username}
                  </Text>
                </VStack>
              </Link>
            </HStack>
            <Flex gap={2} ml="auto" fontSize="sm" fontWeight={500}>
              <p>{r.rating}</p>
              <Text color="brand.slate.500">Points</Text>
            </Flex>
          </HStack>
        ))}
      </Grid>
    </VStack>
  );
}

const faqs: { question: string; answer: string }[] = [
  {
    question: 'What is the Talent Olympics?',
    answer:
      'Talent Olympics is like a virtual job fair, except with users applying with real proof of work.',
  },
  {
    question: 'How do I enter the competition?',
    answer:
      'By submitting to any of the ten challenges under the Frontend and Rust tracks.',
  },
  {
    question: 'Which teams are hiring?',
    answer:
      'Over 50 Solana teams are hiring. In no particular order, here is the list of teams that are hiring: Transfero, Jungle, Khiza, Rippio, Moby Up, Coinlivre, Meta Pool, Prism, Bonk, MH Ventures, Bandit, Turbine, Future, Prizm, MoonThat, Jito, Flash, Mirror World, Pyth, Galaxe, Nosana, Sanctum, Tensor, Metaplex, Backpack, Parcl, Helio, Streamflow, Helius, DeCharge, Orca, Iron, Proto map, SolanaID, WifiDabba, Drift, Squads, Light Protocol, Mango, Sonar Watch, Kamino, Openbook, Staking facilities, Solana Beach, Noenomad, Linum Labs, DUX, VW Trucks & Bus, TRUTHER, Infratoken, One Percent, Bitfinix, etc.',
  },
  {
    question: 'Does winning a Talent Olympics bounty guarantee a job?',
    answer:
      'Winning one or multiple tracks does not guarantee a job, but greatly increases your chances of catching the eye of the hiring partners.',
  },
  {
    question: 'Can I participate in any track or challenge?',
    answer:
      "Yes, you can participate in any track, and any number of challenges as you'd like. But remember, that quality of your submission is the most important thing.",
  },
  {
    question: 'What is the prize split like?',
    answer:
      "The individual prizes for each challenge are mentioned in the listings themselves. On top of that, there's a separate prize pool of $10,000 for the best overall participants. We will consider both the quality (most important criteria) and the number of challenges that participants have submitted to for the grand prize, based on the reviews from our partners.",
  },
];

function FAQs() {
  return (
    <VStack py={8}>
      <Text fontSize="xl" fontWeight={700}>
        FAQ
      </Text>
      <Accordion w="full" maxW="35rem" allowToggle>
        {faqs.map((f) => (
          <AccordionItem
            key={f.question}
            my={4}
            borderWidth={1}
            shadow="md"
            rounded="lg"
          >
            <h2>
              <AccordionButton
                py="0.8rem"
                _expanded={{ bg: 'blackAlpha.50' }}
                rounded="0.25rem"
              >
                <Box
                  as="span"
                  flex="1"
                  fontSize={{ base: 'sm', sm: 'md' }}
                  textAlign="left"
                >
                  {f.question}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel
              pb={4}
              fontSize={{ base: 'sm', sm: 'md' }}
              dangerouslySetInnerHTML={{ __html: f.answer }}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </VStack>
  );
}

const CountDownRenderer = ({
  days,
  hours,
  minutes,
}: {
  days: number;
  hours: number;
  minutes: number;
}) => {
  if (days > 0) {
    return <span>{`${days}d:${hours}h`}</span>;
  }
  return <span>{`${hours}h:${minutes}m`}</span>;
};

const SubscribeHackathon = () => {
  const [isSubscribeLoading, setIsSubscribeLoading] = useState(false);
  const [sub, setSub] = useState<
    (SubscribeHackathon & { User: User | null })[]
  >([]);

  const { user } = useUser();
  const posthog = usePostHog();
  const [update, setUpdate] = useState<boolean>(false);

  const handleToggleSubscribe = async () => {
    setIsSubscribeLoading(true);
    try {
      await axios.post('/api/hackathon/subscribe/toggle', {
        slug: SLUG,
      });
      setUpdate((prev) => !prev);
      toast.success(
        sub.find((e) => e.userId === user?.id) ? 'Unsubscribed' : 'Subscribed',
      );
    } catch (error) {
      console.log(error);
      toast.error('Error occurred while toggling subscription');
    } finally {
      setIsSubscribeLoading(false);
    }
  };

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const { data } = await axios.post('/api/hackathon/subscribe/get', {
          slug: SLUG,
        });
        setSub(data);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      }
    };
    fetchSubscriptions();
  }, [update]);

  return (
    <div className="flex gap-2">
      <HStack align="start">
        <AuthWrapper
          showCompleteProfileModal
          completeProfileModalBodyText={
            'Please complete your profile before subscribing to a hackathon.'
          }
        >
          <IconButton
            className="ph-no-capture"
            color={
              sub.find((e) => e.userId === user?.id)
                ? 'white'
                : 'brand.slate.500'
            }
            bg={
              sub.find((e) => e.userId === user?.id)
                ? 'brand.purple'
                : 'brand.slate.100'
            }
            aria-label="Notify"
            icon={
              isSubscribeLoading ? (
                <Spinner color="white" size="sm" />
              ) : sub.find((e) => e.userId === user?.id) ? (
                <TbBellRinging />
              ) : (
                <TbBell />
              )
            }
            onClick={() => {
              posthog.capture(
                sub.find((e) => e.userId === user?.id)
                  ? 'unnotify me_hackathon'
                  : 'notify me_hackathon',
              );
              handleToggleSubscribe();
            }}
            variant="solid"
          />
        </AuthWrapper>
      </HStack>
      <HStack whiteSpace={'nowrap'}>
        <VStack align={'start'} gap={0}>
          <Text color={'white'} fontWeight={500}>
            {sub?.length ? sub.length : 0}
          </Text>
          <Text
            display={{ base: 'none', md: 'flex' }}
            color={'brand.slate.300'}
            fontSize={'sm'}
            fontWeight={400}
          >
            {sub?.length === 1 ? 'Person' : 'People'} Interested
          </Text>
        </VStack>
      </HStack>
    </div>
  );
};

function KashModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent w="100vw" p={0} aspectRatio={16 / 9}>
        <ModalBody p={0}>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/QSw-xf54PT0?autoplay=1"
          ></iframe>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
}

const Marquee: React.FC<MarqueeProps> = ({ children, speed = 50 }) => {
  const [contentWidth, setContentWidth] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateContentWidth = () => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.scrollWidth / 2);
      }
    };

    updateContentWidth();
    window.addEventListener('resize', updateContentWidth);

    return () => {
      window.removeEventListener('resize', updateContentWidth);
    };
  }, [children]);

  const marqueeAnimation = keyframes`
    0% { transform: translateX(0); }
    100% { transform: translateX(-${contentWidth}px); }
  `;

  const duration = contentWidth / speed;

  return (
    <Box pos="relative" overflow="hidden">
      <Flex
        ref={contentRef}
        animation={`${marqueeAnimation} ${duration}s linear infinite`}
        whiteSpace="nowrap"
      >
        {children}
        {children}
      </Flex>
    </Box>
  );
};

interface TextStylerProps {
  text: string;
}

const TextStyler: React.FC<TextStylerProps> = ({ text }) => {
  const words = text.split(' ');

  return (
    <Text fontSize="lg">
      {words.map((word, index) => {
        if (word.toLowerCase() === '<redacted>') {
          return (
            <Box
              key={index}
              as="span"
              display="inline-block"
              mx={1}
              px={2}
              color="transparent"
              bg="gray.200"
              borderRadius="md"
              textShadow="0 0 32px white"
              userSelect="none"
              filter="blur(4px)"
              title="Redacted content"
            >
              redac
            </Box>
          );
        }
        return <span key={index}>{word} </span>;
      })}
    </Text>
  );
};

const rankedUsers: { email: string; rating: number }[] = [
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
  {
    email: 'pratik.dholani1@gmail.com',
    rating: 69,
  },
];

interface CountryLeader {
  location: string;
  submission_count: number;
}
export const getServerSideProps: GetServerSideProps = async ({}) => {
  const countryLeaders = await prisma.$queryRaw<CountryLeader[]>`
SELECT 
    u.location,
    COUNT(s.id) as submission_count
FROM 
    Hackathon h
JOIN 
    Bounties b ON h.id = b.hackathonId
JOIN 
    Submission s ON b.id = s.listingId
JOIN 
    User u ON s.userId = u.id
WHERE 
    h.slug = ${'talent-olympics'}
GROUP BY 
    u.location
ORDER BY 
    submission_count DESC
LIMIT 10;
`;

  const countryLeaderLength = countryLeaders.length;
  if (countryLeaderLength < 10) {
    const restSuperteams = Superteams.filter(
      (s) =>
        countryLeaderLength === 0 ||
        !countryLeaders.some((c) => s.country.includes(c.location)),
    ).slice(0, 10 - countryLeaderLength);

    for (let i = 0; i < 10 - countryLeaderLength; i++) {
      countryLeaders.push({
        location: restSuperteams[i]?.country[0] ?? 'na',
        submission_count: 0,
      });
    }
  }

  const emails = rankedUsers.map((u) => u.email);
  const emailProfiles = await prisma.user.findMany({
    where: {
      email: { in: emails },
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      photo: true,
      email: true,
    },
  });

  const rankedProfiles = rankedUsers
    .map((u) => ({
      user: emailProfiles.find((p) => p.email === u.email),
      rating: u.rating,
    }))
    .sort((a, b) => b.rating - a.rating);

  return {
    props: {
      countryLeaders: JSON.parse(
        JSON.stringify(countryLeaders, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      ),
      rankings: rankedProfiles,
    },
  };
};
