import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../config/chakra.config';
import { Wallet } from '../context/connectWalletContext';
// Styles
import '../styles/globals.scss';
import '@fontsource/inter/';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ChakraProvider theme={theme}>
        <Wallet>
          <Component {...pageProps} />
        </Wallet>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
