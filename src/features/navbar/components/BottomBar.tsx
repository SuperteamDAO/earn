import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

import GoHome from '@/components/icons/GoHome';
import IoNewspaperOutline from '@/components/icons/IoNewspaperOutline';
import IoSearchOutline from '@/components/icons/IoSearchOutline';
import IoWalletOutline from '@/components/icons/IoWalletOutline';
import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface Props {
  onSearchOpen: () => void;
  onWalletOpen: () => void;
  walletBalance: number;
}

export function BottomBar({
  onSearchOpen,
  onWalletOpen,
  walletBalance,
}: Props) {
  const { user } = useUser();
  const router = useRouter();
  const { authenticated, ready } = usePrivy();

  function setColor(href: string, routerPath: string) {
    return routerPath === href || routerPath === `/earn${href}`
      ? user?.isPro
        ? 'text-zinc-800'
        : 'text-brand-purple'
      : 'text-slate-500';
  }

  const iconStyle = {
    width: '1.7rem',
    height: '1.7rem',
    strokeWidth: '1.5',
  };

  const linkStyle = {
    WebkitTapHighlightColor: 'transparent',
  } as React.CSSProperties;

  if (router.asPath.startsWith('/earn/new/')) {
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
          setColor('/earn', router.asPath),
          'w-12 hover:bg-transparent active:bg-transparent',
        )}
        asChild
      >
        <Link href="/earn" style={linkStyle}>
          <GoHome
            style={{
              width: '1.7rem',
              height: '1.7rem',
              strokeWidth: 0.2,
            }}
          />
        </Link>
      </Button>

      <Button
        variant="ghost"
        onClick={onSearchOpen}
        style={linkStyle}
        className={cn(
          setColor('/earn/search', router.pathname),
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
          setColor('/earn/feed/', router.asPath),
          'relative w-12 hover:bg-transparent active:bg-transparent',
        )}
        asChild
      >
        <Link href="/earn/feed/" style={linkStyle}>
          <IoNewspaperOutline
            style={{
              width: '1.55rem',
              height: '1.55rem',
            }}
          />
          <div className="absolute top-1 right-3 h-2.5 w-2.5 rounded-full bg-red-500" />
        </Link>
      </Button>

      {authenticated && user?.isTalentFilled ? (
        <Button
          variant="ghost"
          className={cn(
            'relative m-0 w-12 p-0 hover:bg-transparent active:bg-transparent',
          )}
          onClick={onWalletOpen}
        >
          <IoWalletOutline style={iconStyle} className="text-slate-500" />
          <span
            className={cn(
              'absolute top-px -right-0.5 block rounded-md px-1 py-px text-[10px] font-semibold tracking-tight text-white',
              user?.isPro ? 'bg-zinc-700' : 'bg-brand-purple/95',
            )}
          >
            ${formatNumberWithSuffix(walletBalance || 0, 1, false)}
          </span>
        </Button>
      ) : !authenticated && ready ? (
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
            setColor(`/earn/t/${user?.username}/`, router.asPath),
            'w-12 hover:bg-transparent active:bg-transparent',
          )}
          asChild
        >
          <Link
            href={`/earn/t/${user?.username}`}
            style={{
              ...linkStyle,
              pointerEvents: user ? 'auto' : 'none',
            }}
          >
            <EarnAvatar className="size-7" id={user?.id} avatar={user?.photo} />
          </Link>
        </Button>
      </AuthWrapper>
    </div>
  );
}
