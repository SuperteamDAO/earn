import localFont from 'next/font/local';

/**
 * Satoshi Variable Font - Primary font for ST body text
 * Supports weights 300-900 (use font-weight to control)
 */
export const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/Satoshi-Variable.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  weight: '300 900',
});

/**
 * Archivo Semi Expanded - Secondary font for ST headings
 * Multiple weights for different heading styles
 */
export const archivo = localFont({
  src: [
    {
      path: '../../public/fonts/Archivo_SemiExpanded-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Archivo_SemiExpanded-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Archivo_SemiExpanded-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-archivo',
  display: 'swap',
});

/**
 * DM Sans Variable Font - Used for specific ST heading styles
 * Supports weights 100-900 (use font-weight to control)
 */
export const dmSans = localFont({
  src: '../../public/fonts/DMSans-Variable.ttf',
  variable: '--font-dm-sans',
  display: 'swap',
  weight: '100 900',
});

/**
 * Combined font class names for applying to ST pages
 */
export const stFontVariables = [
  satoshi.variable,
  archivo.variable,
  dmSans.variable,
].join(' ');
