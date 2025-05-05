import { Home, Newspaper, Search, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Button } from '@/components/ui/button';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

interface Props {
  onSearchOpen: () => void;
}

export function BottomBar({ onSearchOpen }: Props) {
  const { user } = useUser();
  const router = useRouter();

  function setColor(href: string, routerPath: string) {
    return routerPath === href ? 'text-brand-purple' : 'text-slate-400';
  }

  const iconStyle = { width: '1.5rem', height: '1.5rem' };

  const linkStyle = {
    WebkitTapHighlightColor: 'transparent',
  } as React.CSSProperties;

  if (router.asPath.startsWith('/new/')) {
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
          setColor('/', router.asPath),
          'hover:bg-transparent active:bg-transparent',
        )}
        asChild
      >
        <Link href="/" style={linkStyle}>
          <Home style={iconStyle} />
        </Link>
      </Button>

      <Button
        variant="ghost"
        onClick={onSearchOpen}
        style={linkStyle}
        className={cn(
          setColor('/search', router.pathname),
          'hover:bg-transparent active:bg-transparent',
        )}
      >
        <Search style={iconStyle} />
      </Button>

      <Button
        variant="ghost"
        className={cn(
          setColor('/feed/', router.asPath),
          'relative hover:bg-transparent active:bg-transparent',
        )}
        asChild
      >
        <Link href="/feed/" style={linkStyle}>
          <Newspaper style={iconStyle} />
          <div className="absolute top-1 right-3 h-2.5 w-2.5 rounded-full bg-red-500" />
        </Link>
      </Button>

      <AuthWrapper>
        <Button
          variant="ghost"
          className={cn(
            setColor(`/t/${user?.username}/`, router.asPath),
            'hover:bg-transparent active:bg-transparent',
          )}
          asChild
        >
          <Link
            href={`/t/${user?.username}`}
            style={{
              ...linkStyle,
              pointerEvents: user ? 'auto' : 'none',
            }}
          >
            <User style={iconStyle} />
          </Link>
        </Button>
      </AuthWrapper>
    </div>
  );
}
