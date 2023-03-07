import { mode, StyleFunctionProps } from '@chakra-ui/theme-tools';

export const styles = {
  global: (props: StyleFunctionProps) => ({
    fonts: {
      body: 'Inter',
      heading: 'Inter',
      text: 'Inter',
    },
    body: {
      bg: '#F7FAFC',
      fontFamily: 'Inter',
    },
  }),
};
