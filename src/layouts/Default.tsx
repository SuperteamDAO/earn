import { Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import { Footer, Header } from '@/features/navbar';

type IDefaultProps = {
  meta: ReactNode;
  children: ReactNode;
  className?: string;
};

const Default = (props: IDefaultProps) => {
  return (
    <Flex
      className={`min-h-full ${props.className}`}
      justify={'space-between'}
      direction={'column'}
      minH={'100vh'}
    >
      {props.meta}
      <Header />
      {props.children}
      <Footer />
    </Flex>
  );
};

export { Default };
