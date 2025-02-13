import { type ReactNode } from 'react';

import { PROJECT_NAME } from '@/constants/project';
import { Meta } from '@/layouts/Meta';
import { cn } from '@/utils/cn';

import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function ListingBuilderFormLayout({
  className,
  children,
  ...props
}: LayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col justify-between bg-background',
        className,
      )}
      {...props}
    >
      <Meta
        title={`Create a Listing | ${PROJECT_NAME}`}
        description={`Create a listing on ${PROJECT_NAME} and gain access to thousands of high quality talent`}
      />
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
