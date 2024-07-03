import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  useBreakpointValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { SubscribeHackathon } from '@prisma/client';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import NextImage, { type StaticImageData } from 'next/image';
import NextLink from 'next/link';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import Marquee from 'react-fast-marquee';
import { toast } from 'react-hot-toast';
import { FaPlay } from 'react-icons/fa';
import { FaDiscord } from 'react-icons/fa6';
import { TbBell, TbBellRinging } from 'react-icons/tb';

import { tokenList } from '@/constants';
import { AuthWrapper } from '@/features/auth';
import { WarningModal } from '@/features/listings';
import type { User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import RiseIn from '@/public/assets/company-logos/rise-in.svg';
import Superteam from '@/public/assets/company-logos/superteam.svg';
import Turbine from '@/public/assets/company-logos/turbine.svg';
import CashBag from '@/public/assets/hackathon/talent-olympics/cashbag.png';
import Coder from '@/public/assets/hackathon/talent-olympics/coder.png';
import Trophy from '@/public/assets/hackathon/talent-olympics/trophy.png';
import WinFlag from '@/public/assets/hackathon/talent-olympics/winflag.png';
import { userStore } from '@/store/user';
import { TalentOlympicsHeader } from '@/svg/talent-olympics-header';

dayjs.extend(utc);

const SLUG = 'talent-olympics';

const base = '/assets/hackathon/talent-olympics/';
const baseAsset = (filename: string) => base + filename;
const frontendTrack: TrackProps[] = [
  {
    icon: baseAsset('scan.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('laptop.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('cube.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('cube2.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('code.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('scan.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
];

const rustTrack: TrackProps[] = [
  {
    icon: baseAsset('monitor.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('git.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('filegit.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('book.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('bookmark.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
  {
    icon: baseAsset('monitor.svg'),
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '/listings/hackathon/code-a-landing-page-with-next/',
  },
];

export default function TalentOlympics() {
  const PADX = 4;
  const START_DATE = '2024-07-11T11:59:59Z';
  const CLOSE_DATE = '2024-07-14T11:59:59Z';

  const [hackathonIsOn, setHackathonIsOn] = useState(false);
  useEffect(() => {
    const hackathonStartTime = dayjs(START_DATE);

    const checkHackathonStatus = () => {
      const now = dayjs.utc();
      console.log('now - ', now.toString());
      if (now.isAfter(hackathonStartTime)) {
        setHackathonIsOn(true);
      }
    };

    checkHackathonStatus();

    const intervalId = setInterval(checkHackathonStatus, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    console.log('hackathonIsOn', hackathonIsOn);
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
      <Box>
        <Hero START_DATE={START_DATE} CLOSE_DATE={CLOSE_DATE} />
        <Box overflowX="hidden" maxW="8xl" mx="auto" px={PADX}>
          <GetHiredBy />
        </Box>
        <Divider borderColor="brand.slate.300" />
        <Box overflowX="hidden" maxW="8xl" mx="auto" px={PADX}>
          <About />
        </Box>
        <Box pos="relative" px={PADX} py={8} bg="#F8FAFC">
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
            maxW="8xl"
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
        <Box overflowX="hidden" maxW="8xl" mx="auto" px={PADX}>
          <FAQs />
        </Box>
      </Box>
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

  const [countdownDate, setCountdownDate] = useState<Date>(
    new Date(START_DATE),
  );
  const [status, setStatus] = useState<'Open In' | 'Close In' | 'Closed'>(
    'Open In',
  );

  useEffect(() => {
    if (dayjs().isAfter(CLOSE_DATE, 'day')) {
      setStatus('Closed');
    } else if (dayjs().isAfter(START_DATE, 'day')) {
      setCountdownDate(new Date(CLOSE_DATE));
      setStatus('Close In');
    }
  }, []);

  return (
    <Flex
      align="center"
      direction={'column'}
      pt={'3rem'}
      pb={'1rem'}
      bgImage={"url('/assets/hackathon/talent-olympics/bg.png')"}
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
            href="https://discord.gg/ftXZKeNv4w"
            rounded="full"
            target="_blank"
          >
            <FaDiscord style={{ width: '1.2rem', height: '1.2rem' }} />
            Join Discord
          </Button>

          {!isSM && <SubscribeHackathon />}
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
        {isSM && <SubscribeHackathon />}
      </Flex>
      <Text mt={4} color="white" fontSize={'9px'}>
        POWERED BY
      </Text>
      <Flex align="center" gap={8} my={4}>
        <Image
          as={NextImage}
          h={PoweredByHeight}
          alt="Web3 Builders Alliance"
          src={Turbine}
        />
        <Image
          as={NextImage}
          h={PoweredByHeight}
          alt="Superteam"
          src={Superteam}
        />
        <Image as={NextImage} h={PoweredByHeight} alt="Rise In" src={RiseIn} />
      </Flex>
    </Flex>
  );
}

function GetHiredBy() {
  const base = '/assets/company-logos/';
  const baseAsset = (filename: string) => base + filename;

  const hiredBy: { name: string; src: string }[] = [
    {
      name: 'Mirron World',
      src: baseAsset('mirror-world.svg'),
    },
    {
      name: 'Pyth',
      src: baseAsset('pyth.png'),
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
      name: 'Nosana',
      src: baseAsset('nosana.svg'),
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
      src: baseAsset('turbine.svg'),
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
      src: baseAsset('bonk.svg'),
    },
    {
      name: 'MH Ventures',
      src: baseAsset('mh-ventures.svg'),
    },
  ];
  return (
    <Flex align="center" gap={8} w="full" py={6}>
      <Box display="block" w="max-content" color="brand.slate.400">
        Get Hired By{' '}
      </Box>
      <Marquee autoFill pauseOnHover>
        {hiredBy.map((h) => (
          <NextImage
            key={h.name}
            src={h.src}
            height={20}
            width={40}
            alt={h.name}
            style={{
              width: 'fit-content',
              height: '2rem',
              margin: '0 1rem',
            }}
          />
        ))}
      </Marquee>
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
            <Image
              alt="kash"
              src="/assets/hackathon/talent-olympics/kash.png"
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
              image={Trophy}
              title="45 Companies Hiring"
              description="at the Talent Olympics"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={CashBag}
              title="$20,000 USDC"
              description="as cash prizes for the best submissions"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={Coder}
              title="Front End & Rust Tracks"
              description="with multiple challenges"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={WinFlag}
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
  image: StaticImageData;
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
      <Image as={NextImage} alt={title} src={image as any} />
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
    <VStack align="start" gap={6}>
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
    <Box
      as={NextLink}
      maxW="lg"
      p={{ base: 3, md: 4 }}
      bg="white"
      borderWidth={'1px'}
      borderColor="brand.slate.200"
      borderRadius={8}
      pointerEvents={hackathonIsOn ? 'auto' : 'none'}
      cursor={hackathonIsOn ? 'pointer' : 'not-allowed'}
      href={hackathonIsOn ? link : '#'}
    >
      <Flex align="center" gap={5}>
        <Image
          w={{ base: 12, md: '4.5rem' }}
          h={{ base: 12, md: '4.5rem' }}
          borderRadius={3}
          objectFit={'cover'}
          alt={title}
          src={icon}
        />
        <Flex direction={'column'}>
          <Text
            color={'brand.slate.900'}
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={600}
          >
            {title}
          </Text>
          <Text
            color={'brand.slate.500'}
            fontSize={{ base: 'sm', md: 'md' }}
            textOverflow={'ellipsis'}
            noOfLines={2}
          >
            {description}
          </Text>
        </Flex>
      </Flex>
      <Flex align="center" justify={'end'} gap={1} mt={3}>
        <Image
          w={{ base: 4, md: 6 }}
          h={{ base: 4, md: 6 }}
          alt={token}
          rounded={'full'}
          src={tokenList.find((t) => t.tokenSymbol === token)?.icon || ''}
        />
        <Text
          color={'brand.slate.700'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {amount?.toLocaleString()}
        </Text>
        <Text
          color={'brand.slate.400'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {token}
        </Text>
      </Flex>
    </Box>
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
      'Over 45 Solana teams are hiring. In no particular order, here is the list of teams that are hiring: Transfero, Jungle , Khiza, Rippio, Moby Up, Coinlivre, Meta Pool, Prism , Bonk, MH Ventures, Bandit, Turbine, Future, Prizm, MoonThat , Jito, Flash, Parcl, Mirror World, Pyth, Galaxe, Nosana, Sanctum, Tensor , Metaplex, Backpack , Helio, Streamflow, Helius, Orca, Iron, Drift , Squads , Mango , Kamino, Openbook, Solana Beach , Noenomad, Linum Labs, DUX, VW Trucks & Bus, TRUTHER, Infratoken, One Percent and Bitfinix.',
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
    (SubscribeHackathon & {
      User: User | null;
    })[]
  >([]);

  const { userInfo } = userStore();
  const posthog = usePostHog();
  const {
    isOpen: warningIsOpen,
    onOpen: warningOnOpen,
    onClose: warningOnClose,
  } = useDisclosure();
  const [update, setUpdate] = useState<boolean>(false);

  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === 'authenticated';

  const handleSubscribe = async () => {
    if (isAuthenticated) {
      if (!userInfo?.isTalentFilled) {
        warningOnOpen();
        return;
      }

      setIsSubscribeLoading(true);
      try {
        await axios.post('/api/hackathon/subscribe/subscribe', {
          slug: SLUG,
        });
        setUpdate((prev) => !prev);
        setIsSubscribeLoading(false);
        toast.success('Subscribed to the listing');
      } catch (error) {
        console.log(error);
        setIsSubscribeLoading(false);
        toast.error('Error');
      }
    }
  };
  const handleUnSubscribe = async (idSub: string) => {
    setIsSubscribeLoading(true);

    try {
      await axios.post('/api/hackathon/subscribe/unSubscribe', {
        id: idSub,
      });
      setUpdate((prev) => !prev);
      setIsSubscribeLoading(false);
      toast.success('Unsubscribed');
    } catch (error) {
      console.log(error);
      setIsSubscribeLoading(false);
      toast.error('Error');
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await axios.post('/api/hackathon/subscribe/get', {
        slug: SLUG,
      });
      setSub(data);
    };
    fetchUser();
  }, [update]);

  return (
    <HStack>
      {warningIsOpen && (
        <WarningModal
          onCTAClick={() => posthog.capture('complete profile_CTA pop up')}
          isOpen={warningIsOpen}
          onClose={warningOnClose}
          title={'Complete your profile'}
          bodyText={
            'Please complete your profile before subscribing to a hackthon.'
          }
          primaryCtaText={'Complete Profile'}
          primaryCtaLink={'/new/talent'}
        />
      )}
      <HStack align="start">
        <AuthWrapper>
          <IconButton
            className="ph-no-capture"
            color={
              sub.find((e) => e.userId === userInfo?.id) ? 'white' : 'white'
            }
            bg={
              sub.find((e) => e.userId === userInfo?.id)
                ? 'brand.purple'
                : 'rgba(34, 35, 36, 0.46)'
            }
            aria-label="Notify"
            icon={
              isSubscribeLoading ? (
                <Spinner color="white" size="sm" />
              ) : sub.find((e) => e.userId === userInfo?.id) ? (
                <TbBellRinging />
              ) : (
                <TbBell />
              )
            }
            onClick={() => {
              if (sub.find((e) => e.userId === userInfo?.id)) {
                posthog.capture('unnotify me_hackathon');
                handleUnSubscribe(
                  sub.find((e) => e.userId === userInfo?.id)?.id as string,
                );

                return;
              }
              posthog.capture('notify me_hackathon');
              handleSubscribe();
            }}
            variant="solid"
          />
        </AuthWrapper>
      </HStack>
      <HStack whiteSpace={'nowrap'}>
        <VStack align={'start'} gap={0}>
          <Text color={'white'} fontWeight={500}>
            {sub?.length ? sub.length + 1 : 1}
          </Text>
          <Text
            display={{ base: 'none', md: 'flex' }}
            color={'brand.slate.300'}
            fontSize={'sm'}
            fontWeight={400}
          >
            {(sub?.length ? sub.length + 1 : 1) === 1 ? 'Person' : 'People'}{' '}
            Interested
          </Text>
        </VStack>
      </HStack>
    </HStack>
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
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
          ></iframe>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
