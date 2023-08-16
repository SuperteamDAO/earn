import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
// Styles
import 'degen/styles';
import 'nprogress/nprogress.css';
import '../styles/globals.scss';
// Fonts
import '@fontsource/inter/';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
// import "@fontsource/domine/"
import '@fontsource/domine/400.css';
import '@fontsource/domine/500.css';
import '@fontsource/domine/600.css';
import '@fontsource/domine/700.css';

import { ChakraProvider } from '@chakra-ui/react';
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { AppProps } from 'next/app';
import { Router } from 'next/router';
import NProgress from 'nprogress';

import theme from '../config/chakra.config';
import { Wallet } from '../context/connectWalletContext';

function MyApp({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient();
  Router.events.on('routeChangeStart', () => NProgress.start());
  Router.events.on('routeChangeComplete', () => NProgress.done());
  Router.events.on('routeChangeError', () => NProgress.done());
  // const { userInfo } = userStore();
  // const { isOpen, onOpen, onClose } = useDisclosure();

  // useEffect(() => {
  //   if (!userInfo || !userInfo.isTalentFilled || !userInfo.isVerified) {
  //     const timeoutId = setTimeout(() => {
  //       onOpen();
  //     }, 5000);
  //     return () => clearTimeout(timeoutId);
  //   }
  //   return () => {};
  // }, [userInfo, onOpen]);

  return (
    <>
      <ChakraProvider theme={theme}>
        <Wallet>
          <QueryClientProvider client={queryClient}>
            <Hydrate state={pageProps.dehydratedState}>
              <ReactQueryDevtools initialIsOpen={false} />
              {/* <WarningModal
                isOpen={isOpen}
                onClose={onClose}
                title="Create a Profile on ST Earn"
                primaryCtaText="Complete Profile"
                primaryCtaLink="/new/talent"
                isTitleCentered
              >
                <Image
                  mb={8}
                  alt="complete profile"
                  src="/assets/talent/completeprofile.png"
                />
                <List spacing={2}>
                  <ListItem>
                    <Flex align="start">
                      <Icon as={CheckCircleIcon} mt={1} color="#6562FF" />
                      <Box pl={2}>
                        Receive personalized email alerts for new bounties
                        relevant to you
                      </Box>
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Flex align="start">
                      <Icon as={CheckCircleIcon} mt={1} color="#6562FF" />
                      <Box pl={2}>
                        Get discovered by global companies for full-time or
                        contract work
                      </Box>
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Flex align="start">
                      <Icon as={CheckCircleIcon} mt={1} color="#6562FF" />
                      <Box pl={2}>
                        Build proof-of-work and show off your skills in one
                        place.
                      </Box>
                    </Flex>
                  </ListItem>
                </List>
              </WarningModal> */}
              <Component {...pageProps} />
            </Hydrate>
          </QueryClientProvider>
        </Wallet>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
