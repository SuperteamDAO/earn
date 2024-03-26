import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

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
      grey: {
        50: '#F7FAFC',
      },
    },
  },
  breakpoints: {
    base: '0em',
    xs: '24em',
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
  space: {
    85: '21rem',
    120: '46.0625rem',
    brand: {
      85: '21rem',
      120: '46.0625rem',
    },
  },
  config,
  styles,
  components: {
    Switch: {
      baseStyle: {
        track: {
          bg: 'brand.slate.400',
          _checked: {
            bg: 'brand.purple',
          },
        },
      },
    },
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
          _disabled: {
            _hover: {
              color: 'white',
              bg: 'brand.purple !important',
            },
          },
        },
        outline: {
          color: 'brand.purple',
          bg: 'transparent',
          borderColor: 'brand.purple',
          _hover: {
            color: 'white',
            bg: 'brand.purple',
          },
          _disabled: {
            _hover: {
              color: 'brand.purple',
              bg: 'transparent !important',
              borderColor: 'brand.purple',
            },
          },
        },
        outlineSecondary: {
          color: 'brand.slate.400',
          bg: 'transparent',
          border: '1px solid',
          borderColor: 'brand.slate.400',
          _hover: {
            color: 'white',
            bg: 'brand.slate.400',
          },
          _disabled: {
            _hover: {
              color: 'brand.slate.400',
              bg: 'transparent !important',
              borderColor: 'brand.slate.400',
            },
          },
        },
        ghost: {
          color: 'brand.slate.500',
          bg: 'transparent',
          _hover: {
            color: 'white',
            bg: 'brand.purple',
          },
          _disabled: {
            _hover: {
              color: 'brand.slate.500',
              bg: 'transparent !important',
            },
          },
        },
      },
    },
  },
});

export default theme;
