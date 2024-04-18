import { Flex, Grid } from '@chakra-ui/react';
import localFont from 'next/font/local';
import Head from 'next/head';
import { useState } from 'react';

const font = localFont({
  src: '../../../public/assets/landingsponsor/fonts/OverusedGrotesk-VF.woff2',
  variable: '--font-overused-grotesk',
});
console.log(font);

import {
  FAQs,
  Features,
  Footer,
  Header,
  Hero,
  ListingTypes,
  ListingWork,
  Stats,
  Testimonials,
} from '@/features/sponsor';

const Sponsor = () => {
  const [videoPopup, setVideoPopup] = useState<boolean>(false);

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
          w={{ base: '95vw', lg: '60vw' }}
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
            src="https://www.youtube.com/embed/tHdS-JNwsgg?autoplay=1&mute=1"
          ></iframe>
        </Flex>
      </Grid>
    );
  };

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

      {videoPopup && <VideoPlayback />}

      <Header />

      <Flex
        className={`${font.className}`}
        overflow="hidden"
        bg="white"
        flexFlow="column"
        placeItems="center"
        style={font.style}
      >
        <Flex
          pos="relative"
          align="center"
          justify="center"
          overflow="hidden"
          w="100%"
          flexFlow="column"
        >
          <Hero />
          <ListingTypes />
          <Features showVideo={() => setVideoPopup(true)} />
          <Stats />
          <ListingWork />
          <Testimonials />
          <FAQs />
          <Footer />
        </Flex>
      </Flex>
    </>
  );
};

export default Sponsor;
