/* eslint-disable @next/next/no-img-element */
import { TriangleUpIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Grid,
  Image,
  Link,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { Footer } from '../components/Footer';

// Images
const SponsorPage = '/assets/landingsponsor/displays/sponsorpage.png';
const FireIcon = '/assets/landingsponsor/icons/fire.png';
const ZapIcon = '/assets/landingsponsor/icons/zap.png';
const MoneyIcon = '/assets/landingsponsor/icons/money.png';
const ProfileIcon = '/assets/landingsponsor/icons/profile.png';
const TalentDirectoryDisplay =
  '/assets/landingsponsor/displays/talentdirectory.png';
const FindAnySkillsDisplay = '/assets/landingsponsor/displays/findanyskill.png';
const DialectDisplay = '/assets/landingsponsor/displays/chatwithdialect.png';
const OnchainEarningsDisplay =
  '/assets/landingsponsor/displays/onchainearnings.png';
const SPLTokenDisplay = '/assets/landingsponsor/displays/spltokens.png';
const TemplateDisplay = '/assets/landingsponsor/displays/template.png';
const DifferentListingsDisplay =
  '/assets/landingsponsor/displays/differentlistings.png';
const PrivateListingsDisplay =
  '/assets/landingsponsor/displays/privatelistings.png';
const SponsorHeroDisplay = '/assets/landingsponsor/displays/sponsorhero.png';

// Sponsor Logs
const Foundation = '/assets/landingsponsor/sponsors/foundation.png';
const Pyth = '/assets/landingsponsor/sponsors/pyth.png';
const StreamFlow = '/assets/landingsponsor/sponsors/streamflow.png';
const Wormhole = '/assets/landingsponsor/sponsors/wormhole.png';
const Dialect = '/assets/landingsponsor/sponsors/dialect.png';
const Spaces = '/assets/landingsponsor/sponsors/spaces.png';
const Orbis = '/assets/landingsponsor/sponsors/orbis.png';

const Sponsor = () => {
  const [isLargerThan12800px] = useMediaQuery('(min-width: 80rem)');
  const [isLessThan600px] = useMediaQuery('(max-width: 600px)');

  const [navbarBg, setNavbarBg] = useState<boolean>(false);
  const [videoPopup, setVideoPopup] = useState<boolean>(false);

  const changeBackground = () => {
    if (window.scrollY >= 80) {
      setNavbarBg(true);
    } else {
      setNavbarBg(true);
    }
  };

  useEffect(() => {
    const html = document.querySelector('html');
    try {
      if (isLessThan600px) {
        html!.style.fontSize = '60%';
      } else {
        html!.style.fontSize = '100%';
      }
    } catch (error) {
      console.log(error);
    }
  }, [isLessThan600px]);

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
        fontFamily="Inter"
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

        <Text zIndex={2} color="white" fontSize="3rem" fontWeight={700}>
          The Talent Layer for Solana
        </Text>

        <Flex pos="relative" justify="center" gap="2.5rem" w="100%">
          <Button
            zIndex={2}
            w="12.5rem"
            h="3.125rem"
            color="bg.100"
            fontSize="1.125rem"
            bg="white"
            borderRadius="0.625rem"
            onClick={() => {
              // alert('')
              // router.push('/new')
              window.location.href = '/sponsor/create';
            }}
          >
            Get Started
          </Button>
          <Flex align="center" gap="1.25rem" fontSize="1rem" fontWeight={700}>
            <Box zIndex={2} minW="2.3125rem" h="2.3125rem" borderRadius="50%">
              <img
                src="/assets/randompeople/kash.png"
                style={{ width: '100%', height: '100%' }}
                alt="Kash"
              />
            </Box>

            <Link
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
                Get a Bounty Strategy Session
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
            <Text color="gray.700" fontSize="2.75rem" fontWeight={700}>
              Outsource Work as Bounties, Jobs & Grants
            </Text>
            <Text color="gray.500" fontSize="1.5rem" fontWeight={400}>
              Superteam Earn helps Solana founders save time and outsource all
              kinds of work and eat glass fast.
            </Text>
          </Flex>
          {isLargerThan12800px ? (
            <Box zIndex={2}>
              <img
                src={DifferentListingsDisplay}
                alt="Image"
                width="100%"
                height="100%"
                style={{ zIndex: '2', objectFit: 'contain' }}
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
          <Box w="18.75rem">
            <img src={TemplateDisplay} alt="Image" width="" height="100%" />
          </Box>
          <Box w="18.75rem">
            <img src={SPLTokenDisplay} alt="Image" width="" height="100%" />
          </Box>
          <Box w="18.75rem">
            <img
              src={PrivateListingsDisplay}
              alt="Image"
              width=""
              height="100%"
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
              <img
                src={TalentDirectoryDisplay}
                alt="Image"
                width="100%"
                height="100%"
                style={{ zIndex: '2', objectFit: 'contain' }}
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
            <Text color="gray.700" fontSize="2.75rem" fontWeight={700}>
              Identify and Reach Out to Top Talent
            </Text>
            <Text color="gray.500" fontSize="1.5rem" fontWeight={400}>
              Our Talent Directory captures verified on-chain earnings to
              separate the real workers from the posers.
            </Text>
          </Flex>
        </Flex>

        <Flex zIndex={2} justify="space-between" wrap="wrap" w="100%">
          <Box w="30%">
            <img
              src={FindAnySkillsDisplay}
              alt="Image"
              width=""
              height="100%"
            />
          </Box>
          <Box w="30%">
            <img src={DialectDisplay} alt="Image" width="" height="100%" />
          </Box>
          <Box w="30%">
            <img
              src={OnchainEarningsDisplay}
              alt="Image"
              width=""
              height="100%"
            />
          </Box>
        </Flex>
      </Flex>
    );
  }

  function Sec2() {
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
            <Image w="100%" h="100%" alt="Icon" src={ProfileIcon} />
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
            <Image w="100%" h="100%" alt="Icon" src={MoneyIcon} />
          </Box>
          <Box>
            <Text color="gray.800" fontSize="1.5rem" fontWeight={700}>
              $13m+
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={600}>
              Total Value Listed
            </Text>
          </Box>
        </Flex>

        <Flex align="center" gap="0.625rem">
          <Box w="3.75rem" h="3.75rem">
            <Image w="100%" h="100%" alt="Icon" src={ZapIcon} />
          </Box>
          <Box>
            <Text color="gray.800" fontSize="1.5rem" fontWeight={700}>
              560+
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={600}>
              Earning Opportunities
            </Text>
          </Box>
        </Flex>

        <Flex align="center" gap="0.625rem">
          <Box w="3.75rem" h="3.75rem">
            <Image w="100%" h="100%" alt="Icon" src={FireIcon} />
          </Box>
          <Box>
            <Text color="gray.800" fontSize="1.5rem" fontWeight={700}>
              20+
            </Text>
            <Text color="gray.500" fontSize="1.25rem" fontWeight={600}>
              Submissions Per Bounty
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
          <img src={Spaces} alt="Spaces" style={{ height: '15%' }} />
          <img src={Dialect} alt="Dialect" style={{ height: '18%' }} />
          <img src={Wormhole} alt="Wormhole" style={{ height: '20%' }} />
          <img src={Orbis} alt="Orbis" style={{ height: '20%' }} />
          <img src={Pyth} alt="Pyth" style={{ height: '20%' }} />
          <img src={Foundation} alt="Foundation" style={{ height: '15%' }} />
          <img src={StreamFlow} alt="StreamFlow" style={{ height: '20%' }} />
        </Flex>

        <Flex align="center" justify="end" wrap="wrap" gap="1.25rem" w="100%">
          <Flex flex="1" gap="1.875rem" minW="25rem" flexFlow="column">
            <Text
              maxW="50rem"
              mt="1.25rem"
              color="gray.700"
              fontSize="2.75rem"
              fontWeight={600}
            >
              Leverage the Talent Layer of Solana in Minutes
            </Text>
            <Text
              maxW="37.5rem"
              color="gray.500"
              fontSize="1.5rem"
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
            <Image
              w={'100%'}
              h={'100%'}
              objectFit="contain"
              alt="Image"
              src={SponsorPage}
            />
          </Box>
        </Flex>
      </Flex>
    );
  }

  function Hero() {
    return (
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
            fontSize="3rem"
            fontWeight={700}
            lineHeight="3.75rem"
            textAlign="start"
          >
            Where Top Solana Founders Meet Top Global Talent
          </Text>
          <Text
            w="100%"
            color="gray.500"
            fontSize="1.5rem"
            fontWeight={400}
            textAlign="start"
          >
            Whether you have a bounty, a grant, or a full-time job that you need
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
                // router.push('/new')
                window.location.href = '/sponsor/create';
              }}
              variant="primary"
            >
              Get Started
            </Button>
            <Flex align="center" gap="0.5rem" fontSize="1rem" fontWeight={700}>
              <Box minW="2.3125rem" h="2.3125rem" borderRadius="50%">
                <img
                  src="/assets/randompeople/kash.png"
                  style={{ width: '100%', height: '100%' }}
                  alt="Kash"
                />
              </Box>

              <Link
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
                  Get a Bounty Strategy Session
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
            <Image
              w={'100%'}
              h={'100%'}
              objectFit="contain"
              alt="Image"
              id={'sponsor-hero'}
              src={SponsorHeroDisplay}
            />
          </Box>
        ) : null}
      </Flex>
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
        <Box minW={'0.8125rem'} h="0.8125rem">
          <img src="/assets/logo/new-logo.svg" alt="Logo" />
        </Box>

        <Flex
          gap="1.875rem"
          color="gray.500"
          fontSize={!isLessThan600px ? '0.8125rem' : '0.4rem'}
          fontWeight="400"
        >
          <Link href="https://earn.superteam.fun/dashboard/company/findtalent">
            Directory
          </Link>
          <Link href="https://earn.superteam.fun/opportunities/category/bounties">
            Bounties
          </Link>
          <Link
            href="#demo"
            onClick={() => {
              window.scrollTo({
                top: document.body.scrollHeight,
                left: 0,
                behavior: 'smooth',
              });
            }}
          >
            Get a Bounty Strategy Session
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
            // alert('')
            // router.push('/new')
            window.location.href = '/sponsor/create';
          }}
          variant="primary"
        >
          Get Started
        </Button>
      </Flex>

      <Flex
        overflow="hidden"
        w="100vw"
        fontFamily="Inter"
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

/*
 const breakpoints = {
  sm: '30em', // 480px
  md: '48em', // 768px
  lg: '62em', // 992px
  xl: '80em', // 1280px
 '2xl': '96em', // 1536px
}
 */

export default Sponsor;
