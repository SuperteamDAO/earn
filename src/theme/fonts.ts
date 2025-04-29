import localFont from 'next/font/local';

const fontSans = localFont({
  src: [
    {
      path: '../../public/fonts/Mona-Sans.woff2',
      weight: '200 900',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const fontFKGrotesk = localFont({
  src: [
    {
      path: '../../public/fonts/FKGrotesk.woff2',
      weight: '200 900',
      style: 'normal',
    },
  ],
  variable: '--font-fk-grotesk',
  display: 'swap',
});
export { fontFKGrotesk, fontSans };
