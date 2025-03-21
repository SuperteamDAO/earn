'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
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

const avatarBadgeVariants = cva(
  'absolute size-4 rounded-full bg-background flex items-stretch justify-stretch *:grow *:rounded-full',
  {
    variants: {
      position: {
        bottomLeft: 'bottom-0 -left-1',
        bottomRight: 'bottom-0 -right-1',
        topLeft: 'top-0 -left-1',
        topRight: 'top-0 -right-1',
      },
    },
    defaultVariants: {
      position: 'bottomLeft',
    },
  },
);

export interface AvatarBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarBadgeVariants> {
  children?:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | null
    | never[];
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

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
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
