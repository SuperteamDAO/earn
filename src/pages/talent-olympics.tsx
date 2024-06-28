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
  Image,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import NextImage, { type StaticImageData } from 'next/image';
import NextLink from 'next/link';
import Marquee from 'react-fast-marquee';
import { FaDiscord } from 'react-icons/fa6';

import { tokenList } from '@/constants';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import RiseIn from '@/public/assets/company-logos/rise-in.svg';
import Superteam from '@/public/assets/company-logos/superteam.svg';
import WBA from '@/public/assets/company-logos/WBA.svg';
import CashBag from '@/public/assets/hackathon/talent-olympics/cashbag.png';
import Coder from '@/public/assets/hackathon/talent-olympics/coder.png';
import Trophy from '@/public/assets/hackathon/talent-olympics/trophy.png';
import WinFlag from '@/public/assets/hackathon/talent-olympics/winflag.png';
import { TalentOlympicsHeader } from '@/svg/talent-olympics-header';

const frontendTrack: TrackProps[] = [
  {
    icon: '/assets/hackathon/talent-olympics/scan.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/scan.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/scan.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/scan.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/scan.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/scan.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
];

const rustTrack: TrackProps[] = [
  {
    icon: '/assets/hackathon/talent-olympics/monitor.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/monitor.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/monitor.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/monitor.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/monitor.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
  {
    icon: '/assets/hackathon/talent-olympics/monitor.svg',
    title: 'Code a landing page with Next',
    description:
      'Write programs to make a fresh new landing page with next to your existing landing page. ',
    amount: 1000,
    token: 'USDC',
    link: '#',
  },
];

export default function TalentOlympics() {
  const PADX = 4;
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
        <Hero />
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
            <Track title="Front End Track" tracks={frontendTrack} />
            <Track title="Rust Track" tracks={rustTrack} />
          </Flex>
        </Box>
        <Box overflowX="hidden" maxW="8xl" mx="auto" px={PADX}>
          <FAQs />
        </Box>
      </Box>
    </Default>
  );
}

function Hero() {
  const PoweredByHeight = '2.5rem';
  const isSM = useBreakpointValue({ base: false, sm: true });

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
        styles={{ height: isSM ? '10rem' : '7rem', width: 'auto' }}
      />
      <Text
        maxW="md"
        mt={4}
        px={6}
        color="white"
        fontWeight={500}
        textAlign={'center'}
      >
        May the best talent get the best jobs judged purely on their proof of
        work!
      </Text>
      <Flex align="center" gap={{ base: 3, sm: 6 }} mt={6} mb={1}>
        <Button
          gap={2}
          px={6}
          color="white"
          fontSize={{ base: 'xs', sm: 'sm' }}
          bg="#6366F1"
          _active={{ bg: '#6366D1' }}
          rounded="full"
        >
          <FaDiscord style={{ width: '1.2rem', height: '1.2rem' }} />
          Join Discord
        </Button>
        <Button
          alignItems="center"
          gap={2}
          px={6}
          color="#39FFC1"
          fontSize={{ base: 'xs', sm: 'sm' }}
          bg="rgba(0, 0, 0, 0.4)"
          pointerEvents={'none'}
          rounded="full"
        >
          <Circle bg="#39FFC1" size={1.5} />
          <Text fontWeight={500}>Submissions TBA</Text>
        </Button>
      </Flex>
      <Text mt={4} color="white" fontSize={'9px'}>
        POWERED BY
      </Text>
      <Flex align="center" gap={8} my={4}>
        <Image
          as={NextImage}
          h={PoweredByHeight}
          alt="Web3 Builders Alliance"
          src={WBA}
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
      <Marquee>
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
  return (
    <Grid
      gap={{ base: 8, md: 12 }}
      templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
      my={8}
    >
      <GridItem>
        <VStack align="start" gap={4}>
          <Text fontSize={'xl'} fontWeight={700}>
            Solana’s first Jobathon is here
          </Text>
          <Text color="brand.slate.500">
            Talent Olympics Jobathon is the ultimate platform for aspiring devs
            to prove their mettle. Give your best, and stand a chance not only
            win the bounty, but potentially get a job. $10,000 up for grabs as
            part of the individual challenges, and $10,000 for the top overall
            submitters across all challenges.{' '}
          </Text>
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
              title="30 Companies Hiring"
              description="on the basis of your performance"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={CashBag}
              title="$20,000 USDC"
              description="Cash prizes for the best submissions"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={Coder}
              title="Front end + Rust Track"
              description="Two tracks to participate in"
            />
          </GridItem>
          <GridItem>
            <FeatureCard
              image={WinFlag}
              title="10 Tracks"
              description="To prove you’re the best candidate"
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
      <Image as={NextImage} src={image as any} />
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
}

function Track({ title, tracks }: { title: string; tracks: TrackProps[] }) {
  return (
    <VStack align="start" gap={6}>
      <Text color="brand.slate.900" fontSize="lg" fontWeight={700}>
        {title}
      </Text>
      <VStack gap={4}>
        {tracks.map((t) => (
          <TrackBox key={t.title} {...t} />
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
      href={link}
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
    answer: 'By submitting to any of the ten tracks.',
  },
  {
    question: 'Which teams are hiring?',
    answer:
      'Over 30 Solana teams are hiring. In no particular order, here is the list of teams that are hiring: Mirror World, Pyth, Galxe, Sanctum, Tensor, Metaplex, Backpack, Helio, Helius, Orca, Iron, Drift, Squads, Mango, Kamino, Openbook, Solana Beach, Turbin3, Future Protocol , Flash Trade, Bandit, Trustless Engineering, Bonk, Jito, MH Ventures, Prism, Transfero, Khiza, Moby Up, Jungle, and Nosana.',
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
  {
    question: "What if I don't win?",
    answer:
      'Like any other listing on Superteam Earn, this submission adds to your proof of work, and builds a strong profile for potential employers to see!',
  },
];

function FAQs() {
  return (
    <VStack py={8}>
      <Text fontSize="xl" fontWeight={700}>
        Frequently Asked
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
