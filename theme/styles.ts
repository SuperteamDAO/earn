import type { StyleFunctionProps } from '@chakra-ui/theme-tools';

export const styles = {
  global: (_props: StyleFunctionProps) => ({
    fonts: {
      body: 'Inter',
      heading: 'Inter',
      text: 'Inter',
    },
    body: {
      bg: 'brand.grey.50',
      fontFamily: 'Inter',
    },
    width: {
      HomeCard: '4100rem',
    },
  }),
};
