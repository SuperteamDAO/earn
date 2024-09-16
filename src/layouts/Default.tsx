import { Flex, type FlexProps } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { Header } from '@/features/navbar';

type IDefaultProps = FlexProps & {
  meta: ReactNode;
  children: ReactNode;
  className?: string;
  hideFooter?: boolean;
};

const Footer = dynamic(() =>
  import('@/features/navbar').then((mod) => mod.Footer),
);

export const Default = ({
  className,
  meta,
  children,
  hideFooter,
  ...props
}: IDefaultProps) => {
  return (
    <Flex
      className={`min-h-full ${className}`}
      justify={'space-between'}
      direction={'column'}
      minH={'100vh'}
      {...props}
    >
      {meta}
      <Header />
      <Flex direction="column" flex="1">
        {children}
      </Flex>
      {!hideFooter && <Footer />}
    </Flex>
  );
};
