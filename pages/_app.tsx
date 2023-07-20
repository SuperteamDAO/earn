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
  return (
    <>
      <ChakraProvider theme={theme}>
        <Wallet>
          <QueryClientProvider client={queryClient}>
            <Hydrate state={pageProps.dehydratedState}>
              <ReactQueryDevtools initialIsOpen={false} />
              <Component {...pageProps} />
            </Hydrate>
          </QueryClientProvider>
        </Wallet>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
