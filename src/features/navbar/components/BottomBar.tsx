import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { LuHome, LuNewspaper, LuSearch, LuUser } from 'react-icons/lu';

import { Button } from '@/components/ui/button';
import { AuthWrapper } from '@/features/auth';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

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

  return (
    <div
      className={cn(
        'z-999 flex w-full justify-between border-t border-slate-200 bg-white px-4 py-2',
        'lg:hidden',
      )}
    >
      <NextLink href="/" style={linkStyle}>
        <Button
          variant="ghost"
          className={cn(
            setColor('/', router.asPath),
            'hover:bg-transparent active:bg-transparent',
          )}
        >
          <LuHome style={iconStyle} />
        </Button>
      </NextLink>

      <Button
        variant="ghost"
        onClick={onSearchOpen}
        style={linkStyle}
        className={cn(
          setColor('/search', router.pathname),
          'hover:bg-transparent active:bg-transparent',
        )}
      >
        <LuSearch style={iconStyle} />
      </Button>

      <NextLink href="/feed/" style={linkStyle}>
        <Button
          variant="ghost"
          className={cn(
            setColor('/feed/', router.asPath),
            'relative hover:bg-transparent active:bg-transparent',
          )}
        >
          <LuNewspaper style={iconStyle} />
          <div className="absolute right-3 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        </Button>
      </NextLink>

      <AuthWrapper>
        <NextLink
          href={`/t/${user?.username}`}
          style={{
            ...linkStyle,
            pointerEvents: user ? 'auto' : 'none',
          }}
        >
          <Button
            variant="ghost"
            className={cn(
              setColor(`/t/${user?.username}/`, router.asPath),
              'hover:bg-transparent active:bg-transparent',
            )}
          >
            <LuUser style={iconStyle} />
          </Button>
        </NextLink>
      </AuthWrapper>
    </div>
  );
}
