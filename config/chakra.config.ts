import type { ThemeConfig } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import { StepsTheme as Steps } from 'chakra-ui-steps';

import { styles } from '../theme/styles';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  colors: {
    brand: {
      purple: '#6366F1',
      'purple.light': '#7471ff',
      slate: {
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      charcoal: {
        700: '#334254',
      },
    },
  },
  space: {
    brand: {
      85: '21rem',
      120: '46.0625rem',
    },
  },
  config,
  styles,
  components: {
    Steps,
    Button: {
      baseStyle: {
        bg: 'brand.purple',
        _hover: {
          bg: 'white',
        },
        rounded: 'md',
        color: 'white',
      },
      variants: {
        solid: {
          color: 'white',
          bg: 'brand.purple',
          _hover: {
            color: 'white',
            bg: 'brand.purple.light',
          },
        },
        ghost: {
          color: 'brand.slate.500',
          bg: 'transparent',
          _hover: {
            color: 'white',
            bg: 'brand.purple',
          },
        },
      },
    },
  },
});

export default theme;
