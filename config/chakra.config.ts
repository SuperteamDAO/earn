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
    'brand.purple': '#6366F1',
    'brand.slate.100': '#f1f5f9',
    'brand.slate.200': '#e2e8f0',
    'brand.slate.300': '#cbd5e1',
    'brand.slate.400': '#94a3b8',
    'brand.slate.500': '#64748b',
    'brand.slate.600': '#475569',
    'brand.slate.700': '#334155',
    'brand.slate.800': '#1e293b',
    'brand.slate.900': '#0f172a',
    'brand.charcoal.700': '#334254',
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
  },
});

export default theme;
