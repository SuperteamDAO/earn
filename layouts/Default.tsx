import type { ReactNode } from 'react';

import Header from '@/components/Header/Header';

type IDefaultProps = {
  meta: ReactNode;
  children: ReactNode;
};

const Default = (props: IDefaultProps) => {
  return (
    <div className="min-h-full">
      {props.meta}
      <Header />
      {props.children}
    </div>
  );
};

export { Default };
