import type { StyleFunctionProps } from '@chakra-ui/theme-tools';

export const styles = {
  global: (_props: StyleFunctionProps) => ({
    fonts: {
      body: 'Inter',
      heading: 'Inter',
      text: 'Inter',
    },
    body: {
      bg: 'white',
      fontFamily: 'Inter',
    },
    width: {
      HomeCard: '4100rem',
    },
  }),
};
