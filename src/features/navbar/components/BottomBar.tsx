'use client';

import { usePathname } from 'next/navigation';

import GoHome from '@/components/icons/GoHome';
import IoNewspaperOutline from '@/components/icons/IoNewspaperOutline';
import IoSearchOutline from '@/components/icons/IoSearchOutline';
import IoWalletOutline from '@/components/icons/IoWalletOutline';
import { Button } from '@/components/ui/button';
import { useViewer } from '@/lib/viewer';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { useAsPath } from '../hooks/use-here';
import { ShellLink } from './ShellLink';

interface Props {
  onSearchOpen: () => void;
  walletBalance: number;
}

function setColor(href: string, routerPath: string) {
  const path = href.length > 1 ? href.replace(/\/$/, '') : href;
  return routerPath === path || routerPath === `/earn${path}`
    ? 'text-brand-purple'
    : 'text-slate-500';
}

export function BottomBar({ onSearchOpen, walletBalance }: Props) {
  const user = useViewer();
  const authenticated = !!user;
  const asPath = useAsPath();
  const pathname = usePathname() ?? '';

  const iconStyle = {
    width: '1.7rem',
    height: '1.7rem',
    strokeWidth: '1.5',
  };

  const linkStyle = {
    WebkitTapHighlightColor: 'transparent',
  } as React.CSSProperties;

  if (pathname.startsWith('/earn/new/')) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex w-full justify-between border-t border-slate-200 bg-white px-4 py-2',
        'lg:hidden',
      )}
    >
      <Button
        variant="ghost"
        className={cn(
          setColor('/earn', asPath),
          'w-12 hover:bg-transparent active:bg-transparent',
        )}
        asChild
      >
        <ShellLink href="/earn/" style={linkStyle}>
          <GoHome
            style={{
              width: '1.7rem',
              height: '1.7rem',
              strokeWidth: 0.2,
            }}
          />
        </ShellLink>
      </Button>

      <Button
        variant="ghost"
        onClick={onSearchOpen}
        style={linkStyle}
        className={cn(
          setColor('/earn/search', asPath.split('?')[0] ?? ''),
          'w-12 hover:bg-transparent active:bg-transparent',
        )}
      >
        <IoSearchOutline
          style={{
            width: '1.6rem',
            height: '1.6rem',
            strokeWidth: 1.5,
          }}
        />
      </Button>

      <Button
        variant="ghost"
        className={cn(
          setColor('/earn/feed/', asPath),
          'relative w-12 hover:bg-transparent active:bg-transparent',
        )}
        asChild
      >
        <ShellLink href="/earn/feed/" style={linkStyle}>
          <IoNewspaperOutline
            style={{
              width: '1.55rem',
              height: '1.55rem',
            }}
          />
          <div className="absolute top-1 right-3 h-2.5 w-2.5 rounded-full bg-red-500" />
        </ShellLink>
      </Button>

      {authenticated && user?.isTalentFilled ? (
        <Button
          variant="ghost"
          className={cn(
            'relative m-0 w-12 p-0 hover:bg-transparent active:bg-transparent',
          )}
          asChild
        >
          {/* Plain <a>: the wallet is a Privy document with its own CSP. */}
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages */}
          <a href="/earn/wallet/">
            <IoWalletOutline style={iconStyle} className="text-slate-500" />
            <span
              className={cn(
                'absolute top-px -right-0.5 block rounded-md px-1 py-px text-[10px] font-semibold tracking-tight text-white',
                'bg-brand-purple/95',
              )}
            >
              ${formatNumberWithSuffix(walletBalance || 0, 1, false)}
            </span>
          </a>
        </Button>
      ) : !authenticated ? (
        <AuthWrapper>
          <Button
            variant="ghost"
            className={cn(
              'relative m-0 w-12 p-0 hover:bg-transparent active:bg-transparent',
            )}
          >
            <IoWalletOutline style={iconStyle} className="text-slate-500" />
            <span className="bg-brand-purple/95 absolute top-px -right-0.5 block rounded-md px-1 py-px text-[10px] font-semibold tracking-tight text-white">
              ${formatNumberWithSuffix(walletBalance || 0, 1, false)}
            </span>
          </Button>
        </AuthWrapper>
      ) : null}

      <AuthWrapper>
        <Button
          variant="ghost"
          className={cn(
            setColor(`/earn/t/${user?.username}/`, asPath),
            'w-12 hover:bg-transparent active:bg-transparent',
          )}
          asChild
        >
          <ShellLink
            href={`/earn/t/${user?.username}/`}
            style={{
              ...linkStyle,
              pointerEvents: user ? 'auto' : 'none',
            }}
          >
            <EarnAvatar
              className="size-7"
              id={user?.id}
              avatar={user?.photo ?? undefined}
            />
          </ShellLink>
        </Button>
      </AuthWrapper>
    </div>
  );
}
