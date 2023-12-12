import type { StyleFunctionProps } from '@chakra-ui/theme-tools';

export const styles = {
  global: (_props: StyleFunctionProps) => ({
    fonts: {
      body: 'var(--font-sans)',
      heading: 'var(--font-sans)',
      text: 'var(--font-sans)',
    },
    body: {
      bg: 'brand.grey.50',
      fontFamily: 'var(--font-sans)',
    },
    width: {
      HomeCard: '4100rem',
    },
  }),
};
