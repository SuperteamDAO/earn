import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../config/chakra.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Wallet } from '../context/connectWalletContext';
import 'degen/styles';
// Styles
import '@fontsource/inter/';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

function MyApp({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient();
  return (
    <>
      <ChakraProvider theme={theme}>
        <Wallet>
          <QueryClientProvider client={queryClient}>
            <Component {...pageProps} />
          </QueryClientProvider>
        </Wallet>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
