import { ThemeConfig, extendTheme } from '@chakra-ui/react';
import { styles } from '../theme/styles';
import { StepsTheme as Steps } from 'chakra-ui-steps';
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  colors: {},
  config,
  styles,
  components: {
    Steps,
  },
});

export default theme;
