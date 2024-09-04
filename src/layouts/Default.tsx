import { Flex } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { Header } from '@/features/navbar';

type IDefaultProps = {
  meta: ReactNode;
  children: ReactNode;
  className?: string;
};

const Footer = dynamic(() =>
  import('@/features/navbar').then((mod) => mod.Footer),
);

export const Default = (props: IDefaultProps) => {
  return (
    <Flex
      className={`min-h-full ${props.className}`}
      justify={'space-between'}
      direction={'column'}
      minH={'100vh'}
    >
      {props.meta}
      <Header />
      <Flex direction="column" flex="1">
        {props.children}
      </Flex>
      <Footer />
    </Flex>
  );
};
