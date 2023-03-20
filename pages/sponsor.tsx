/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Flex,
    Text,
    Button,
    Box,
    useMediaQuery,
    Link,
    Grid,
    Image
} from '@chakra-ui/react';

import { Footer } from '../components/Footer';


// Images
let SponsorPage = '/assets/landingsponsor/displays/sponsorpage.png';
let FireIcon = '/assets/landingsponsor/icons/fire.png';
let ZapIcon = '/assets/landingsponsor/icons/zap.png';
let MoneyIcon = '/assets/landingsponsor/icons/money.png';
let ProfileIcon = '/assets/landingsponsor/icons/profile.png';
let TalentDirectoryDisplay = '/assets/landingsponsor/displays/talentdirectory.png';
let FindAnySkillsDisplay = '/assets/landingsponsor/displays/findanyskill.png';
let DialectDisplay = '/assets/landingsponsor/displays/chatwithdialect.png';
let OnchainEarningsDisplay = '/assets/landingsponsor/displays/onchainearnings.png';
let SPLTokenDisplay = '/assets/landingsponsor/displays/spltokens.png';
let TemplateDisplay = '/assets/landingsponsor/displays/template.png';
let DifferentListingsDisplay = '/assets/landingsponsor/displays/differentlistings.png';
let PrivateListingsDisplay = '/assets/landingsponsor/displays/privatelistings.png';
let SponsorHeroDisplay = '/assets/landingsponsor/displays/sponsorhero.png';

// Sponsor Logs
let Foundation = '/assets/landingsponsor/sponsors/foundation.png';
let Pyth = '/assets/landingsponsor/sponsors/pyth.png';
let StreamFlow = '/assets/landingsponsor/sponsors/streamflow.png';
let Wormhole = '/assets/landingsponsor/sponsors/wormhole.png';
let Dialect = '/assets/landingsponsor/sponsors/dialect.png';
let Spaces = '/assets/landingsponsor/sponsors/spaces.png';
let Orbis = '/assets/landingsponsor/sponsors/orbis.png';

import { CloseIcon, TriangleUpIcon } from '@chakra-ui/icons';

const Sponsor = () => {
    const [isLargerThan12800px] = useMediaQuery('(min-width: 80rem)');
    const [isLessThan600px] = useMediaQuery('(max-width: 600px)');

    const [navbarBg, setNavbarBg] = useState<boolean>(false);
    const [videoPopup, setVideoPopup] = useState<boolean>(false);

    const router = useRouter();
    const changeBackground = () => {
        if (window.scrollY >= 80) {
            setNavbarBg(true);
        } else {
            setNavbarBg(false);
        }
    };

    useEffect(() => {
        let html = document.querySelector('html');
        try {
            if (isLessThan600px) {
                html.style.fontSize = "60%"
            }
            else {
                html.style.fontSize = "100%"
            }
        } catch (error) {
            console.log(error);
        }

    }, [isLessThan600px])


    useEffect(() => {
        changeBackground();
        // adding the event when scroll change background
        window.addEventListener('scroll', changeBackground);
    }, []);

    const VideoPlayback = () => {
        return (
            <Grid
                height="100vh"
                w="100vw"
                bg="rgba(191, 203, 220, 0.67)"
                zIndex="100"
                placeContent="center"
                position="fixed"
                fontFamily="Inter"
                onClick={() => setVideoPopup(false)}
            >
                <Flex
                    flexFlow="column"
                    gap="1.25rem"
                    pos="relative"
                    overflow="hidden"
                    w="60vw"
                    pt="56.25%"
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

    return (
        <>
            {videoPopup && <VideoPlayback />}

            <Flex
                justify="space-around"
                align="center"
                w="100vw"
                zIndex={10}
                pos="fixed"
                bg={navbarBg ? 'white' : 'transparent'}
                padding="0.625rem"

            >
                <Box h="0.8125rem" minW={"0.8125rem"}>
                    <img
                        src="/assets/logo/logo.png"
                        alt="Logo"
                        style={{ width: '100%', height: '100%' }}
                    />
                </Box>

                <Flex fontSize={(!isLessThan600px) ? "0.8125rem" : "0.4rem"} fontWeight="400" color="gray.500" gap="1.875rem" >
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
                    fontSize="0.875rem"
                    borderRadius="0.625rem"
                    variant="primary"
                    bg={"#6562FF"}
                    color={"white"}
                    onClick={() => router.push('/new')}
                >
                    Get Started
                </Button>
            </Flex>

            <Flex
                flexFlow="column"
                fontFamily="Inter"
                w="100vw"
                placeItems="center"
                overflow="hidden"

            >
                <Flex
                    justify="center"
                    flexFlow="column"
                    align="center"
                    pos="relative"
                    overflow="hidden"
                    bg={"white"}
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

    function Sec5() {
        return <Flex
            mt="9.375rem"
            mb="9.375rem"
            h="21.875rem"
            bg="#6562FF"
            borderRadius="1.25rem"
            w="80%"
            flexFlow="column"
            justify="center"
            align="center"
            pos="relative"
            gap="1.875rem"
            padding="0 3.125rem"

        >
            <Box
                pos="absolute"
                right="50%"
                borderRadius="50%"
                bg="radial-gradient(31% 40% at 35% 55%, #A762FF 33.11%, #A762FF 90%) "
                filter="blur(31.25rem)"
                w="15.625rem"
                h="25rem"
                transform="rotate(80deg)"
                zIndex={1}
            ></Box>

            <Text fontSize="3rem" color="white" fontWeight={700} zIndex={2}>
                The Talent Layer for Solana
            </Text>

            <Flex gap="2.5rem" w="100%" justify="center" pos="relative">
                <Button
                    zIndex={2}
                    bg="white"
                    color="bg.100"
                    h="3.125rem"
                    w="12.5rem"
                    fontSize="1.125rem"
                    borderRadius="0.625rem"
                    onClick={() => router.push('/new')}
                >
                    Get Started
                </Button>
                <Flex
                    fontSize="1rem"
                    fontWeight={700}
                    gap="1.25rem"
                    align="center"
                >
                    <Box minW="2.3125rem" h="2.3125rem" borderRadius="50%" zIndex={2}>
                        <img
                            src="/assets/randompeople/kash.png"
                            style={{ width: '100%', height: '100%' }}
                            alt="Kash" />
                    </Box>

                    <Link
                        href="https://airtable.com/shrmOAXpF2vhONYqe"
                        isExternal
                        _hover={{ textDecoration: 'none' }}
                    >
                        <Text
                            color="white"
                            lineHeight="1.25rem"
                            cursor="pointer"
                            fontWeight={700}
                            fontSize="1rem"
                            borderBottom="0.0625rem dashed"
                            borderColor="white"
                            padding="0.125rem"
                        >
                            Get a Bounty Strategy Session
                        </Text>
                    </Link>
                </Flex>
            </Flex>
        </Flex>;
    }


    function Sec4() {
        return <Flex
            gap="6rem"
            padding="5rem 5rem"
            borderRadius="1.875rem"
            mt="9.375rem"
            bg="#F0FEFF"
            w="80%"
            align="center"
            justify="center"
            flexFlow="column"
            overflow={"hidden"}


        >
            <Flex gap="6.25rem" pos="relative">
                <Flex gap="1.25rem" flexFlow="column" zIndex={2}>
                    <Text fontSize="1.375rem" color="#56A4D0" fontWeight={700}>
                        Create Listings
                    </Text>
                    <Text fontSize="2.75rem" color="gray.700" fontWeight={700}>
                        Outsource Work as Bounties, Jobs & Grants
                    </Text>
                    <Text fontSize="1.5rem" color="gray.500" fontWeight={400}>
                        Superteam Earn helps Solana founders save time and outsource
                        all kinds of work and eat glass fast.
                    </Text>
                </Flex>
                {isLargerThan12800px ? (
                    <Box zIndex={2}>
                        <img
                            src={DifferentListingsDisplay}
                            alt="Image"
                            width="100%"
                            height="100%"
                            style={{ zIndex: '2', objectFit: 'contain' }} />
                    </Box>
                ) : null}

                <Box
                    pos="absolute"
                    top="-12.5rem"
                    right="0"
                    borderRadius="50%"
                    bg="radial-gradient(31% 40% at 35% 55%, #E1FFCA 33.11%, #E1FFCA 90%) "
                    filter="blur(6.25rem)"
                    w="32.5rem"
                    h="25rem"
                    zIndex={1}
                ></Box>
            </Flex>

            <Flex
                justify="space-between"
                gap="2.5rem"
                zIndex={2}
                w="100%"
                flexWrap="wrap"
            >
                <Box w="18.75rem">
                    <img
                        src={PrivateListingsDisplay}
                        alt="Image"
                        width=""
                        height="100%" />
                </Box>
                <Box w="18.75rem">
                    <img
                        src={TemplateDisplay}
                        alt="Image"
                        width=""
                        height="100%" />
                </Box>
                <Box w="18.75rem">
                    <img
                        src={SPLTokenDisplay}
                        alt="Image"
                        width=""
                        height="100%" />
                </Box>
            </Flex>
        </Flex>;
    }


    function Sec3() {
        return <Flex
            gap="6rem"
            padding="5rem 5rem"
            borderRadius="3rem"
            mt="13rem"
            bg="#F2F0FF"
            w="80%"
            align="center"
            justify="center"
            flexFlow="column"
            overflow={"hidden"}

        >
            <Flex gap="6.25rem" pos="relative">
                {isLargerThan12800px ? (
                    <Box zIndex="2" w={"60%"}>
                        <img
                            src={TalentDirectoryDisplay}
                            alt="Image"
                            width="100%"
                            height="100%"
                            style={{ zIndex: '2', objectFit: 'contain' }} />
                    </Box>
                ) : null}

                <Box
                    pos="absolute"
                    top="-1.25rem"
                    borderRadius="50%"
                    bg="radial-gradient(31% 40% at 35% 55%, #E8CAFF 33.11%, #E8CAFF 90%) "
                    filter="blur(6.25rem)"
                    w="52rem"
                    h="40rem"
                    zIndex={1}
                ></Box>
                <Flex gap="2rem" flexFlow="column" zIndex={2}>
                    <Text fontSize="1.375rem" color="#A956D0" fontWeight={700}>
                        DIRECTORY
                    </Text>
                    <Text fontSize="2.75rem" color="gray.700" fontWeight={700}>
                        Identify and reach out to top talent
                    </Text>
                    <Text fontSize="1.5rem" color="gray.500" fontWeight={400}>
                        Our Talent Directory captures verified on-chain earnings to
                        separate the real workers from the posers.
                    </Text>
                </Flex>
            </Flex>

            <Flex
                justify="space-between"

                zIndex={2}
                w="100%"
                flexWrap="wrap"
            >
                <Box w="30%">
                    <img
                        src={FindAnySkillsDisplay}
                        alt="Image"
                        width=""
                        height="100%" />
                </Box>
                <Box w="30%">
                    <img
                        src={DialectDisplay}
                        alt="Image"
                        width=""
                        height="100%" />
                </Box>
                <Box w="30%">
                    <img
                        src={OnchainEarningsDisplay}
                        alt="Image"
                        width=""
                        height="100%" />
                </Box>
            </Flex>
        </Flex>;
    }

    function Sec2() {
        return (
            <Flex
                justify="space-between"
                w="80%"
                mt="5rem"
                flexWrap="wrap"
                align="center"
                gap="1.25rem"

            >
                <Flex gap="1.25rem" align="center">
                    <Box w="3.75rem" h="3.75rem">
                        <Image src={ProfileIcon} width="100%" height="100%" alt="Icon" />
                    </Box>
                    <Box>
                        <Text fontSize="1.5rem" fontWeight={700} color="gray.800">
                            1,500+
                        </Text>
                        <Text fontSize="1.25rem" fontWeight={600} color="gray.500">
                            Weekly Visitors
                        </Text>
                    </Box>
                </Flex>

                <Flex gap="0.625rem" align="center">
                    <Box w="3.75rem" h="3.75rem">
                        <Image src={MoneyIcon} width="100%" height="100%" alt="Icon" />
                    </Box>
                    <Box>
                        <Text fontSize="1.5rem" fontWeight={700} color="gray.800">
                            $13m+
                        </Text>
                        <Text fontSize="1.25rem" fontWeight={600} color="gray.500">
                            Total Value Listed
                        </Text>
                    </Box>
                </Flex>

                <Flex gap="0.625rem" align="center">
                    <Box w="3.75rem" h="3.75rem">
                        <Image src={ZapIcon} width="100%" height="100%" alt="Icon" />
                    </Box>
                    <Box>
                        <Text fontSize="1.5rem" fontWeight={700} color="gray.800">
                            560+
                        </Text>
                        <Text fontSize="1.25rem" fontWeight={600} color="gray.500">
                            Earning Opportunity
                        </Text>
                    </Box>
                </Flex>

                <Flex gap="0.625rem" align="center">
                    <Box w="3.75rem" h="3.75rem">
                        <Image src={FireIcon} width="100%" height="100%" alt="Icon" />
                    </Box>
                    <Box>
                        <Text fontSize="1.5rem" fontWeight={700} color="gray.800">
                            20+
                        </Text>
                        <Text fontSize="1.25rem" fontWeight={600} color="gray.500">
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
                flexWrap="wrap"
                bg="white"
                w="80%"
                align="center"
                justify="center"
                flexFlow="column"

            >
                <Flex
                    w="100%"
                    h="7.5rem"
                    align="center"
                    justify="space-around"
                    mb="3.125rem"
                    gap="1.25rem"
                    flexWrap="wrap"
                >
                    <img src={Spaces} alt="Spaces" style={{ height: '15%' }} />
                    <img src={Dialect} alt="Dialect" style={{ height: '18%' }} />
                    <img src={Wormhole} alt="Wormhole" style={{ height: '20%' }} />
                    <img src={Orbis} alt="Orbis" style={{ height: '20%' }} />
                    <img src={Pyth} alt="Pyth" style={{ height: '20%' }} />
                    <img src={Foundation} alt="Foundation" style={{ height: '15%' }} />
                    <img src={StreamFlow} alt="StreamFlow" style={{ height: '20%' }} />
                </Flex>

                <Flex
                    align="center"
                    flexWrap="wrap"
                    gap="1.25rem"
                    w="100%"
                    justify="end"
                >
                    <Flex minWidth="25rem" flexFlow="column" gap="1.875rem" flex="1">
                        <Text
                            fontSize="2.75rem"
                            color="gray.700"
                            maxWidth="50rem"
                            mt="1.25rem"
                            fontWeight={600}
                        >
                            Leverage the Talent Layer of Solana in Minutes
                        </Text>
                        <Text
                            fontSize="1.5rem"
                            color="gray.500"
                            maxWidth="37.5rem"
                            fontWeight={400}
                        >
                            Have critical work your team needs completed? Superteam Earn will
                            connect you to talented folks who want to help.{' '}
                        </Text>
                        <Flex gap="1.25rem" align="center">
                            <Button
                                w="13.125rem"
                                h="3.4375rem"
                                leftIcon={<TriangleUpIcon transform="rotate(90deg)" mr="0.625rem" />}
                                onClick={() => setVideoPopup(true)}
                                fontSize="1.125rem"
                                variant="purple"
                            >
                                Watch Video
                            </Button>
                            <Text fontSize="1.125rem" color="gray.400" fontWeight={700}>
                                00:45
                            </Text>
                        </Flex>
                    </Flex>

                    <Box w="37.5rem">
                        <Image
                            width={"100%"}
                            height={"100%"}
                            src={SponsorPage}
                            alt="Image"
                            objectFit="contain"
                        />
                    </Box>
                </Flex>
            </Flex>
        );
    }


    function Hero() {
        return (
            <Flex
                w="80%"
                justify="start"
                align="center"
                overflow="hidden"
                mt="9.375rem"
                mb={isLargerThan12800px ? '12.5rem' : '5rem'}

            >
                <Flex
                    justify={isLargerThan12800px ? 'start' : 'center'}
                    align="center"
                    gap="1.875rem"
                    w={isLargerThan12800px ? '45%' : '100%'}
                    flexFlow="column"
                >
                    <Text
                        fontSize="3rem"
                        color="gray.700"
                        textAlign="start"
                        fontWeight={700}
                        lineHeight="3.75rem"
                    >
                        Where Top Solana Founders Meet Top Global Talent
                    </Text>
                    <Text
                        fontSize="1.5rem"
                        textAlign="start"
                        color="gray.500"
                        w="100%"
                        fontWeight={400}
                    >
                        Whether you have a bounty, a grant, or a full-time job that you
                        need filled, we&apos;re here to help (for free!)
                    </Text>

                    <Flex gap="3.75rem" w="100%" justify="start">
                        <Button
                            variant="primary"
                            h="3.125rem"
                            w="12.5rem"
                            fontSize="1.125rem"
                            borderRadius="0.625rem"
                            bg={"#6562FF"}
                            color={"white"}
                        >
                            Get Started
                        </Button>
                        <Flex
                            fontSize="1rem"
                            fontWeight={700}
                            gap="1.25rem"
                            align="center"
                        >
                            <Box minW="2.3125rem" h="2.3125rem" borderRadius="50%">
                                <img
                                    src="/assets/randompeople/kash.png"
                                    style={{ width: '100%', height: '100%' }}
                                    alt="Kash"
                                />
                            </Box>

                            <Link
                                href="https://airtable.com/shrmOAXpF2vhONYqe"
                                isExternal
                                _hover={{ textDecoration: 'none' }}
                            >
                                <Text
                                    color="gray.500"
                                    lineHeight="1.25rem"
                                    cursor="pointer"
                                    fontWeight={700}
                                    fontSize="1rem"
                                    borderBottom="0.0625rem dashed"
                                    borderColor="gray.400"
                                    padding="0.125rem"
                                >
                                    Get a Bounty Strategy Session
                                </Text>
                            </Link>
                        </Flex>
                    </Flex>
                </Flex>

                {isLargerThan12800px ? (
                    <Box w="60%" maxW="90rem" pos="absolute" top="-10%" right="-10%">
                        <Image
                            src={SponsorHeroDisplay}
                            alt="Image"
                            objectFit="contain"
                            width={"100%"}
                            height={"100%"}
                            id={"sponsor-hero"}
                        />
                    </Box>
                ) : null}
            </Flex>
        );
    }

};

export default Sponsor;
