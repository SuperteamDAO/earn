import '@/styles/globals.css'; // 使用 @ 别名指向 src 目录

import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
