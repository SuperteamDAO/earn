import type { ReactNode } from 'react';

import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';

type IDefaultProps = {
  meta: ReactNode;
  children: ReactNode;
  className?: string;
};

const Default = (props: IDefaultProps) => {
  return (
    <div
      className={
        !props.className ? 'min-h-full' : `min-h-full ${props.className}`
      }
    >
      {props.meta}
      <Header />
      {props.children}
      <Footer />
    </div>
  );
};

export { Default };
