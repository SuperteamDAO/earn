import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import { Footer, Header } from '@/features/navbar';

type IDefaultProps = {
  meta: ReactNode;
  children: ReactNode;
  className?: string;
};

const Default = (props: IDefaultProps) => {
  return (
    <Box
      className={
        !props.className ? 'min-h-full' : `min-h-full ${props.className}`
      }
    >
      {props.meta}
      <Header />
      {props.children}
      <Footer />
    </Box>
  );
};

export { Default };
