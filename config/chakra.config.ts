import { ThemeConfig, extendTheme } from "@chakra-ui/react";
import { styles } from "../theme/styles";
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  colors: {},
  config,
  styles,
});

export default theme;
