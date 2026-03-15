'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '@/utils/cn';

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex h-10 w-10 shrink-0 rounded-full', className)}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square h-full w-full rounded-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex h-full w-full items-center justify-center overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

type AvatarGroupContextValue = {
  count?: number;
  limit?: number;
  setCount?: React.Dispatch<React.SetStateAction<number>>;
};

const AvatarGroupContext = React.createContext<AvatarGroupContextValue>({});

function AvatarGroupProvider({
  children,
  limit,
}: {
  children?: React.ReactNode;
  limit?: number;
}) {
  const [count, setCount] = React.useState<number>(0);

  return (
    <AvatarGroupContext.Provider
      value={{
        count,
        setCount,
        limit,
      }}
    >
      {children}
    </AvatarGroupContext.Provider>
  );
}

function useAvatarGroupContext() {
  return React.useContext(AvatarGroupContext);
}

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number;
}

function AvatarGroup({
  children,
  className,
  limit,
  ...props
}: AvatarGroupProps) {
  return (
    <AvatarGroupProvider limit={limit}>
      <div
        data-slot="avatar-group"
        className={cn('relative flex items-center -space-x-3', className)}
        {...props}
      >
        {children}
      </div>
    </AvatarGroupProvider>
  );
}

function AvatarGroupList({ children }: { children?: React.ReactNode }) {
  const { limit, setCount } = useAvatarGroupContext();

  setCount?.(React.Children.count(children));

  return (
    <>{limit ? React.Children.toArray(children).slice(0, limit) : children}</>
  );
}

export { Avatar, AvatarFallback, AvatarGroup, AvatarGroupList, AvatarImage };
