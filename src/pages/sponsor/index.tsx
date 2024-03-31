import { TriangleUpIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Grid,
  Link,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import Head from 'next/head';
import Image, { type ImageProps } from 'next/image';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

import { Footer } from '@/features/navbar';
import DialectDisplay from '@/public/assets/landingsponsor/displays/chatwithdialect.png';
import DifferentListingsDisplay from '@/public/assets/landingsponsor/displays/differentlistings.png';
import FindAnySkillsDisplay from '@/public/assets/landingsponsor/displays/findanyskill.png';
import OnchainEarningsDisplay from '@/public/assets/landingsponsor/displays/onchainearnings.png';
import PrivateListingsDisplay from '@/public/assets/landingsponsor/displays/privatelistings.png';
import SPLTokenDisplay from '@/public/assets/landingsponsor/displays/spltokens.png';
import SponsorHeroDisplay from '@/public/assets/landingsponsor/displays/sponsorhero.png';
// Import images
import SponsorPage from '@/public/assets/landingsponsor/displays/sponsorpage.png';
import TalentDirectoryDisplay from '@/public/assets/landingsponsor/displays/talentdirectory.png';
import TemplateDisplay from '@/public/assets/landingsponsor/displays/template.png';
import FireIcon from '@/public/assets/landingsponsor/icons/fire.png';
import MoneyIcon from '@/public/assets/landingsponsor/icons/money.png';
import ProfileIcon from '@/public/assets/landingsponsor/icons/profile.png';
import ZapIcon from '@/public/assets/landingsponsor/icons/zap.png';
import Dialect from '@/public/assets/landingsponsor/sponsors/dialect.png';
// Sponsor Logos
import Foundation from '@/public/assets/landingsponsor/sponsors/foundation.png';
import Kash from '@/public/assets/landingsponsor/sponsors/kash.png';
import Orbis from '@/public/assets/landingsponsor/sponsors/orbis.png';
import Pyth from '@/public/assets/landingsponsor/sponsors/pyth.png';
import Spaces from '@/public/assets/landingsponsor/sponsors/spaces.png';
import StreamFlow from '@/public/assets/landingsponsor/sponsors/streamflow.png';
import Wormhole from '@/public/assets/landingsponsor/sponsors/wormhole.png';

type Totals = {
  count: number;
  totalInUSD: number;
};

interface HighQualityImageProps extends ImageProps {
  alt: string; // Making 'alt' explicitly required
}
// sets a default quality here, instead of having to specify it in every instance — default set by nextjs images is 75
const HighQualityImage: React.FC<HighQualityImageProps> = ({
  alt,
  ...props
}) => {
  return <Image alt={alt} {...props} quality={90} />;
};
const Sponsor = () => {
  const [isLargerThan12800px] = useMediaQuery('(min-width: 80rem)');
  const [isLessThan600px] = useMediaQuery('(max-width: 600px)');

  const [navbarBg, setNavbarBg] = useState<boolean>(false);
  const [videoPopup, setVideoPopup] = useState<boolean>(false);
  const [totals, setTotals] = useState<Totals | null>(null);

  const changeBackground = () => {
    if (window.scrollY >= 80) {
      setNavbarBg(true);
    } else {
      setNavbarBg(true);
    }
  };

  const fetchTotals = async () => {
    try {
      // Using Next.js's fetch with time-based revalidation for 6 hours (21600 seconds)
      const response = await fetch('/api/sidebar/totals/', {
        next: { revalidate: 21600 },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setTotals(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTotals();
  }, []);

  useEffect(() => {
    changeBackground();
    // adding the event when scroll change background
    window.addEventListener('scroll', changeBackground);
  }, []);

  const VideoPlayback = () => {
    return (
      <Grid
        pos="fixed"
        zIndex="100"
        w="100vw"
        h="100vh"
        fontFamily="var(--font-sans)"
        bg="rgba(191, 203, 220, 0.67)"
        onClick={() => setVideoPopup(false)}
        placeContent="center"
      >
        <Flex
          pos="relative"
          gap="1.25rem"
          overflow="hidden"
          w="60vw"
          pt="56.25%"
          flexFlow="column"
        >
          <iframe
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              top: '0',
              bottom: '0',
              left: '0',
              right: '0',
            }}
            src="https://www.youtube.com/embed/HwFp_9YgVKg?autoplay=1&mute=1"
          ></iframe>
        </Flex>
      </Grid>
    );
  };

  function Sec5() {
    return (
      <Flex
        pos="relative"
        align="center"
        justify="center"
        gap="1.875rem"
        w="80%"
        h="21.875rem"
        mt="9.375rem"
        mb="9.375rem"
        p="0 3.125rem"
        bg="#6562FF"
        borderRadius="1.25rem"
        flexFlow="column"
      >
        <Box
          pos="absolute"
          zIndex={1}
          right="50%"
          w="15.625rem"
          h="25rem"
          bg="radial-gradient(31% 40% at 35% 55%, #A762FF 33.11%, #A762FF 90%) "
          borderRadius="50%"
          transform="rotate(80deg)"
          filter="blur(31.25rem)"
        ></Box>

        <Text
          zIndex={2}
          color="white"
          fontSize="3rem"
          fontWeight={600}
          lineHeight={'1em'}
          letterSpacing={'-0.035em'}
        >
          The Talent Layer for Crypto
        </Text>

        <Flex pos="relative" justify="center" gap="2.5rem" w="100%">
          <Button
            zIndex={2}
            w="12.5rem"
            h="3.125rem"
            color="#6562FF"
            fontSize="1.125rem"
            bg={'white'}
            borderRadius="0.625rem"
            _hover={{ bg: 'white', color: '#6562FF' }}
            onClick={() => {
              window.location.href = '/new/sponsor';
            }}
            variant="solid"
          >
            Get Started
          </Button>
          <Flex align="center" gap="1.25rem" fontSize="1rem" fontWeight={700}>
            <Box
              pos="relative"
              zIndex={2}
              overflow="hidden"
              minW="2.3125rem"
              h="2.3125rem"
              borderRadius="50%"
            >
              <HighQualityImage
                src={Kash}
                alt="Kash Dhanda Profile Picture"
                placeholder="blur"
                fill={true}
                style={{ objectFit: 'contain' }}
                sizes="10vw"
                priority={true}
                loading="eager"
              />
            </Box>

            <Link
              as={NextLink}
              _hover={{ textDecoration: 'none' }}
              href="https://airtable.com/shrmOAXpF2vhONYqe"
              isExternal
            >
              <Text
                p="0.125rem"
                color="white"
                fontSize="1rem"
                fontWeight={700}
                lineHeight="1.25rem"
                borderColor="white"
                borderBottom="0.0625rem dashed"
                cursor="pointer"
              >
                Get Help For Adding Your Listing
              </Text>
            </Link>
          </Flex>
        </Flex>
      </Flex>
    );
  }

  function Sec4() {
    return (
      <Flex
        align="center"
        justify="center"
        gap="6rem"
        overflow={'hidden'}
        w="80%"
        mt="9.375rem"
        p="5rem 5rem"
        bg="#F0FEFF"
        borderRadius="1.875rem"
        flexFlow="column"
      >
        <Flex pos="relative" gap="6.25rem">
          <Flex zIndex={2} gap="1.25rem" flexFlow="column">
            <Text color="#56A4D0" fontSize="1.375rem" fontWeight={700}>
              Create Listings
            </Text>
            <Text
              color="gray.700"
              fontSize="2.75rem"
              fontWeight={500}
              lineHeight={'1em'}
              letterSpacing={'-0.035em'}
              css={{
                textWrap: 'balance',
              }}
            >
              Outsource Work as Bounties, Projects & Grants
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={400}>
              Superteam Earn helps crypto founders save time and outsource all
              kinds of work and eat glass fast.
            </Text>
          </Flex>
          {isLargerThan12800px ? (
            <Box pos="relative" zIndex={2}>
              <HighQualityImage
                src={DifferentListingsDisplay}
                alt="Screenshot of opportunities listed on superteam earn — Web3Auth's Rust Developer job with a salary range of $100k-$200k, Amulet's UI/UX review for 2500 USDC, Port finance' Bug Bounty for $1M USDC"
                style={{ zIndex: '2', objectFit: 'contain' }}
                placeholder="blur"
                sizes="50vw"
              />
            </Box>
          ) : null}

          <Box
            pos="absolute"
            zIndex={1}
            top="-12.5rem"
            right="0"
            w="32.5rem"
            h="25rem"
            bg="radial-gradient(31% 40% at 35% 55%, #E1FFCA 33.11%, #E1FFCA 90%) "
            borderRadius="50%"
            filter="blur(6.25rem)"
          ></Box>
        </Flex>

        <Flex
          zIndex={2}
          justify="space-between"
          wrap="wrap"
          gap="2.5rem"
          w="100%"
        >
          <Box pos="relative" w="18.75rem">
            <HighQualityImage
              src={TemplateDisplay}
              alt="Not sure where to start? Our templates will guide you"
              sizes="33vw"
            />
          </Box>
          <Box pos={'relative'} w="18.75rem">
            <HighQualityImage
              src={SPLTokenDisplay}
              alt="Pay using stablecoins or SPL tokens"
              sizes="33vw"
              priority={true}
            />
          </Box>
          <Box w="18.75rem">
            <HighQualityImage
              src={PrivateListingsDisplay}
              alt="Directly invoice talent via Superteam Earn"
              placeholder="blur"
              sizes="33vw"
              priority={true}
            />
          </Box>
        </Flex>
      </Flex>
    );
  }

  function Sec3() {
    return (
      <Flex
        align="center"
        justify="center"
        gap="6rem"
        overflow={'hidden'}
        w="80%"
        mt="13rem"
        p="5rem 5rem"
        bg="#F2F0FF"
        borderRadius="3rem"
        flexFlow="column"
      >
        <Flex pos="relative" gap="6.25rem">
          {isLargerThan12800px ? (
            <Box zIndex="2" w={'60%'}>
              <HighQualityImage
                src={TalentDirectoryDisplay}
                alt="Search and fitler to identify and reach talent on superteam earn"
                style={{ zIndex: '2', objectFit: 'contain' }}
                placeholder="blur"
                sizes="50vw"
              />
            </Box>
          ) : null}

          <Box
            pos="absolute"
            zIndex={1}
            top="-1.25rem"
            w="52rem"
            h="40rem"
            bg="radial-gradient(31% 40% at 35% 55%, #E8CAFF 33.11%, #E8CAFF 90%) "
            borderRadius="50%"
            filter="blur(6.25rem)"
          ></Box>
          <Flex zIndex={2} gap="2rem" flexFlow="column">
            <Text color="#A956D0" fontSize="1.375rem" fontWeight={700}>
              DIRECTORY
            </Text>
            <Text
              color="gray.700"
              fontSize="2.75rem"
              fontWeight={500}
              lineHeight={'1em'}
              letterSpacing={'-0.035em'}
              css={{
                textWrap: 'balance',
              }}
            >
              Identify and Reach Out to Top Talent
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={400}>
              Our Talent Directory captures verified on-chain earnings to
              separate the real workers from the posers.
            </Text>
          </Flex>
        </Flex>

        <Flex zIndex={2} justify="space-between" wrap="wrap" w="100%">
          <Box w="30%">
            <HighQualityImage
              src={FindAnySkillsDisplay}
              alt="Find any skill you need on superteam earn. Highlighted in the image: Back-End Dev, Design, Smart Contract Dev, Front-End Dev, Community/Growth"
              placeholder="blur"
              sizes="30vw"
            />
          </Box>
          <Box w="30%">
            <HighQualityImage
              src={DialectDisplay}
              alt="Connect without middlemen — get in touch with any talent"
              placeholder="blur"
              sizes="30vw"
            />
          </Box>
          <Box w="30%">
            <HighQualityImage
              src={OnchainEarningsDisplay}
              alt="On-Chain proof of work — View verified earnings"
              placeholder="blur"
              sizes="30vw"
            />
          </Box>
        </Flex>
      </Flex>
    );
  }

  function Sec2() {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };
    return (
      <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap="1.25rem"
        w="80%"
        mt="5rem"
      >
        <Flex align="center" gap="1.25rem">
          <Box w="3.75rem" h="3.75rem">
            <HighQualityImage
              alt="Silhouette of a Person — Avatar"
              src={ProfileIcon}
              placeholder="blur"
              sizes="10vw"
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Box>
            <Text color="gray.800" fontSize="1.5rem" fontWeight={700}>
              1,500+
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={600}>
              Weekly Visitors
            </Text>
          </Box>
        </Flex>

        <Flex align="center" gap="0.625rem">
          <Box w="3.75rem" h="3.75rem">
            <HighQualityImage
              alt="Illustration of money"
              src={MoneyIcon}
              placeholder="blur"
              sizes="10vw"
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Box>
            <Text color="gray.800" fontSize="1.5rem" fontWeight={700}>
              ${formatNumber(totals?.totalInUSD ?? 0)}+
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={600}>
              Total Value Earned
            </Text>
          </Box>
        </Flex>

        <Flex align="center" gap="0.625rem">
          <Box w="3.75rem" h="3.75rem">
            <HighQualityImage
              alt="Illustration of a Lightning"
              src={ZapIcon}
              placeholder="blur"
              style={{ objectFit: 'contain' }}
              sizes="10vw"
            />
          </Box>
          <Box>
            <Text color="gray.800" fontSize="1.5rem" fontWeight={700}>
              {totals?.count}+
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={600}>
              Earning Opportunities
            </Text>
          </Box>
        </Flex>

        <Flex align="center" gap="0.625rem">
          <Box w="3.75rem" h="3.75rem">
            <HighQualityImage
              alt="Illustration of fire"
              src={FireIcon}
              placeholder="blur"
              sizes="10vw"
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Box>
            <Text color="gray.800" fontSize="1.5rem" fontWeight={700}>
              20+
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={600}>
              Submissions Per Listing
            </Text>
          </Box>
        </Flex>
      </Flex>
    );
  }

  function Sec1() {
    return (
      <Flex
        align="center"
        justify="center"
        wrap="wrap"
        w="80%"
        bg="white"
        flexFlow="column"
      >
        <Flex
          align="center"
          justify="space-around"
          wrap="wrap"
          gap="1.25rem"
          w="100%"
          h="7.5rem"
          mb="3.125rem"
        >
          <HighQualityImage
            height={18}
            src={Spaces}
            alt="Spaces Logo"
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Dialect}
            alt="Dialect Logo"
            height={21.6}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Wormhole}
            alt="Wormhole Logo"
            height={24}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Orbis}
            alt="Orbis  Logo"
            height={24}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Pyth}
            alt="Pyth Logo"
            height={24}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={Foundation}
            alt="Foundation Logo"
            height={18}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
          <HighQualityImage
            src={StreamFlow}
            alt="StreamFlow Logo"
            height={24}
            unoptimized={true}
            priority={true}
            loading="eager"
          />
        </Flex>

        <Flex align="center" justify="end" wrap="wrap" gap="1.25rem" w="100%">
          <Flex flex="1" gap="1.875rem" minW="25rem" flexFlow="column">
            <Text
              maxW="31ch"
              mt="1.25rem"
              color="gray.700"
              fontSize="2.75rem"
              fontWeight={500}
              lineHeight={'1em'}
              letterSpacing={'-0.025em'}
              css={{
                textWrap: 'balance',
              }}
            >
              Leverage the Talent Layer of Crypto in Minutes
            </Text>
            <Text
              maxW="37.5rem"
              color="gray.500"
              fontSize="1.25rem"
              fontWeight={400}
            >
              Have critical work your team needs completed? Superteam Earn will
              connect you to talented folks who want to help.{' '}
            </Text>
            <Flex align="center" gap="1.25rem">
              <Button
                w="13.125rem"
                h="3.4375rem"
                color={'#4E41E1'}
                fontSize="1.125rem"
                bg={'#DCDBFF'}
                leftIcon={
                  <TriangleUpIcon transform="rotate(90deg)" mr="0.625rem" />
                }
                onClick={() => setVideoPopup(true)}
                variant="purple"
              >
                Watch Video
              </Button>
              <Text color="gray.400" fontSize="1.125rem" fontWeight={700}>
                00:45
              </Text>
            </Flex>
          </Flex>

          <Box w="37.5rem">
            <HighQualityImage
              alt="Screenshot of Superteam Earn's webpage — showing different bounties, and jobs listed"
              src={SponsorPage}
              placeholder="blur"
              sizes="50vw"
            />
          </Box>
        </Flex>
      </Flex>
    );
  }

  function Hero() {
    return (
      <>
        <Head>
          <title>
            Find Top Talent for Your Crypto Projects on Superteam Earn
          </title>
          <meta
            name="description"
            content="Seeking top talent for your crypto project? Superteam Earn connects you with experts for Bounties, Projects, and Grants in the crypto space."
          />
        </Head>
        <Flex
          align="center"
          justify="start"
          overflow="hidden"
          w="80%"
          mt="9.375rem"
          mb={isLargerThan12800px ? '12.5rem' : '5rem'}
        >
          <Flex
            align="center"
            justify={isLargerThan12800px ? 'start' : 'center'}
            gap="1.875rem"
            w={isLargerThan12800px ? '45%' : '100%'}
            flexFlow="column"
          >
            <Text
              color="gray.700"
              fontFamily="var(--font-sans)"
              fontSize="3.9rem"
              fontWeight={'light'}
              lineHeight="1.15em"
              letterSpacing={'-0.04em'}
              textAlign="start"
            >
              Where Top Crypto Founders Meet Top Global Talent
            </Text>
            <Text
              w="100%"
              color="gray.500"
              fontSize="1.3rem"
              fontWeight={400}
              textAlign="start"
              css={{
                textWrap: 'pretty',
              }}
            >
              Whether you have a bounty, a project, or a grant that you need
              filled, we&apos;re here to help (for free!)
            </Text>

            <Flex justify="start" gap="2rem" w="100%">
              <Button
                w="12.5rem"
                h="3.125rem"
                color={'white'}
                fontSize="1.125rem"
                bg={'#6562FF'}
                borderRadius="0.625rem"
                onClick={() => {
                  window.location.href = '/new/sponsor';
                }}
                variant={'solid'}
              >
                Get Started
              </Button>
              <Flex
                align="center"
                gap="0.5rem"
                fontSize="1rem"
                fontWeight={700}
              >
                <Box minW="2.3125rem" h="2.3125rem" borderRadius="50%">
                  <HighQualityImage
                    src={Kash}
                    style={{ width: '100%', height: '100%' }}
                    alt="Kash"
                    placeholder="blur"
                  />
                </Box>

                <Link
                  as={NextLink}
                  _hover={{ textDecoration: 'none' }}
                  href="https://airtable.com/shrmOAXpF2vhONYqe"
                  isExternal
                >
                  <Text
                    p="0.125rem"
                    color="gray.500"
                    fontSize="0.9rem"
                    fontWeight={700}
                    lineHeight="1.25rem"
                    borderColor="gray.400"
                    borderBottom="0.0625rem dashed"
                    cursor="pointer"
                  >
                    Get Help For Adding Your Listing
                  </Text>
                </Link>
              </Flex>
            </Flex>
          </Flex>

          {isLargerThan12800px ? (
            <Box
              pos="absolute"
              top={{
                base: '-400px',
                lg: '-500px',
                xl: '-180px',
                '2xl': '-500px',
              }}
              right="-10%"
              w="60%"
              maxW="90rem"
            >
              <HighQualityImage
                style={{ objectFit: 'contain' }}
                alt="Illustration of bounties being posted and applications being submitted"
                id={'sponsor-hero'}
                src={SponsorHeroDisplay}
                sizes="50vw"
                priority={true}
                loading="eager"
              />
            </Box>
          ) : null}
        </Flex>
      </>
    );
  }

  return (
    <>
      {videoPopup && <VideoPlayback />}

      <Flex
        pos="fixed"
        zIndex={10}
        align="center"
        justify="space-around"
        w="100vw"
        p="0.625rem"
        bg={navbarBg ? 'white' : 'transparent'}
      >
        <Link as={NextLink} href="/">
          <Box minW={'0.8125rem'} h="0.8125rem">
            <img src="/assets/logo/logo.svg" alt="Superteam Earn Logo" />
          </Box>
        </Link>
        <Flex
          gap="1.875rem"
          color="gray.500"
          fontSize={!isLessThan600px ? '0.8125rem' : '0.4rem'}
          fontWeight="400"
        >
          <Link as={NextLink} href="https://earn.superteam.fun/bounties">
            Listings
          </Link>
          <Link as={NextLink} href="https://airtable.com/shrmOAXpF2vhONYqe">
            Get Help For Adding Your Listing
          </Link>
        </Flex>

        <Button
          w="10.625rem"
          h="2.5rem"
          color={'white'}
          fontSize="0.875rem"
          bg={'#6562FF'}
          borderRadius="0.625rem"
          onClick={() => {
            window.location.href = '/new/sponsor';
          }}
          variant="solid"
        >
          Get Started
        </Button>
      </Flex>

      <Flex
        overflow="hidden"
        w="100vw"
        fontFamily="var(--font-sans)"
        flexFlow="column"
        placeItems="center"
      >
        <Flex
          pos="relative"
          align="center"
          justify="center"
          overflow="hidden"
          bg={'white'}
          flexFlow="column"
        >
          {/* Hero */}
          <Hero />
          {/* sec1 */}
          <Sec1 />
          {/* sec2 */}
          <Sec2 />
          {/* sec3 */}
          <Sec3 />
          {/* sec4 */}
          <Sec4 />
          {/* sec5 */}
          <Sec5 />
          <Footer />
        </Flex>
      </Flex>
    </>
  );
};

export default Sponsor;
