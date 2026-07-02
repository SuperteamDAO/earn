import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Menu,
  Play,
  Search,
  Star,
  Timer,
  User,
  X,
} from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useState,
} from 'react';

import { Meta } from '@/layouts/Meta';
import { cn } from '@/utils/cn';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4';

const navItems = [
  { label: 'Bounties', href: '/earn/bounties' },
  { label: 'Projects', href: '/earn/projects' },
  { label: 'Grants', href: '/earn/grants' },
  { label: 'Talent', href: '/earn/new/talent' },
  { label: 'Sponsors', href: '/earn/sponsor' },
];

const metadataItems = [
  { icon: Star, label: 'Avalanche Ecosystem' },
  { icon: Timer, label: 'Bounties, Projects & Grants' },
  { icon: Calendar, label: 'Paid in USDC / AVAX' },
  { icon: ChevronRight, label: 'Remote-first' },
];

function revealStyle(delay: number): CSSProperties {
  return { animationDelay: `${delay}ms` };
}

function getEarnCanonical() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  try {
    return new URL('/earn/', siteUrl).toString();
  } catch {
    return undefined;
  }
}

function NavIconButton({
  href,
  label,
  children,
  delay,
  className,
}: {
  readonly href: string;
  readonly label: string;
  readonly children: ReactNode;
  readonly delay: number;
  readonly className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'avalanche-liquid-glass avalanche-animate-blur-fade-up inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-50 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98]',
        className,
      )}
      style={revealStyle(delay)}
    >
      {children}
    </Link>
  );
}

type StandalonePage = {
  (): ReactElement;
  standalonePage?: boolean;
};

const AvalancheEarnLanding: StandalonePage = function AvalancheEarnLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canonical = getEarnCanonical();

  return (
    <>
      <Meta
        title="Avalanche Earn | Bounties, Grants & Projects on Avalanche"
        description="Find Avalanche bounties, grants, and project work. Build for leading Avalanche teams, earn in crypto, and apply with one profile."
        canonical={canonical}
      />
      <Head>
        <link rel="preconnect" href="https://d8j0ntlcm91z4.cloudfront.net" />
      </Head>
      <main className="relative flex min-h-[100dvh] overflow-hidden bg-[#070707] font-sans text-zinc-50">
        <video
          className="fixed inset-0 z-0 h-full w-full object-cover"
          src={VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        <div className="avalanche-bottom-blur pointer-events-none fixed inset-0 z-[1]" />

        <div className="relative z-10 flex min-h-[100dvh] w-full flex-col">
          <nav className="relative z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 md:py-6">
            <Link
              href="/earn"
              className="avalanche-animate-blur-fade-up flex h-8 items-center text-sm font-semibold tracking-[0.18em] text-zinc-50 uppercase no-underline transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 md:h-10"
              style={revealStyle(0)}
            >
              Avalanche Earn
            </Link>

            <div className="hidden items-center gap-7 lg:flex">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="avalanche-animate-blur-fade-up text-sm font-medium text-zinc-50/80 no-underline transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  style={revealStyle(100 + index * 50)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/earn/search"
                className="avalanche-liquid-glass avalanche-animate-blur-fade-up hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-50 no-underline transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:inline-flex md:px-6"
                style={revealStyle(350)}
              >
                <span>Search</span>
                <Search size={18} aria-hidden="true" />
              </Link>
              <NavIconButton href="/earn/signin" label="Sign in" delay={400}>
                <User size={18} aria-hidden="true" />
              </NavIconButton>
              <button
                type="button"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-controls="avalanche-mobile-menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((current) => !current)}
                className="avalanche-liquid-glass avalanche-animate-blur-fade-up relative inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-50 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] lg:hidden"
                style={revealStyle(350)}
              >
                <Menu
                  size={20}
                  aria-hidden="true"
                  className={cn(
                    'absolute transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    isMenuOpen
                      ? 'scale-50 rotate-180 opacity-0'
                      : 'scale-100 rotate-0 opacity-100',
                  )}
                />
                <X
                  size={20}
                  aria-hidden="true"
                  className={cn(
                    'absolute transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    isMenuOpen
                      ? 'scale-100 rotate-0 opacity-100'
                      : 'scale-50 -rotate-180 opacity-0',
                  )}
                />
              </button>
            </div>
          </nav>

          <div
            id="avalanche-mobile-menu"
            className={cn(
              'absolute top-[72px] right-0 left-0 z-40 border-y border-zinc-800 bg-zinc-950/95 px-4 py-4 shadow-2xl backdrop-blur-lg transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden',
              isMenuOpen
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-4 opacity-0',
            )}
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'rounded-lg px-3 py-3 text-sm font-medium text-zinc-100 no-underline transition-[background-color,color,transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-zinc-800/50 hover:text-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-50/70',
                    isMenuOpen
                      ? 'translate-x-0 opacity-100'
                      : '-translate-x-4 opacity-0',
                  )}
                  style={revealStyle(index * 50)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4 sm:hidden">
              <Link
                href="/earn/search"
                className="avalanche-liquid-glass inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-50 no-underline focus-visible:ring-2 focus-visible:ring-zinc-50/70"
              >
                <span>Search</span>
                <Search size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/earn/signin"
                className="avalanche-liquid-glass inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-50 no-underline focus-visible:ring-2 focus-visible:ring-zinc-50/70"
              >
                <span>Profile</span>
                <User size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <section className="relative z-10 flex flex-1 flex-col justify-end px-4 pb-8 sm:px-6 md:px-12 md:pb-16">
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-5xl flex-1">
                <div
                  className="avalanche-animate-blur-fade-up mb-6 flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-50/80 sm:gap-6 sm:text-sm md:mb-8"
                  style={revealStyle(300)}
                >
                  {metadataItems.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2"
                    >
                      <Icon
                        size={16}
                        aria-hidden="true"
                        className={cn(
                          label === 'Avalanche Ecosystem' && 'fill-zinc-50',
                        )}
                      />
                      {label}
                    </span>
                  ))}
                </div>

                <h1
                  className="avalanche-animate-blur-fade-up mb-4 max-w-4xl text-4xl leading-[1.02] font-normal tracking-[-0.04em] text-zinc-50 sm:text-5xl md:mb-6 md:text-6xl lg:text-7xl"
                  style={revealStyle(400)}
                >
                  Build What&apos;s Next on Avalanche
                </h1>

                <p
                  className="avalanche-animate-blur-fade-up mb-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg md:mb-12 md:text-xl"
                  style={revealStyle(500)}
                >
                  Discover bounties, grants, and high-impact project work from
                  teams building across the Avalanche ecosystem.
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <Link
                    href="/earn/new/talent"
                    className="avalanche-animate-blur-fade-up inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-50 px-6 py-2.5 text-sm font-semibold text-zinc-950 no-underline transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:px-8 sm:py-3"
                    style={revealStyle(600)}
                  >
                    <Play
                      size={18}
                      aria-hidden="true"
                      className="fill-zinc-950"
                    />
                    <span>Start Earning</span>
                  </Link>
                  <Link
                    href="/earn/new/sponsor"
                    className="avalanche-liquid-glass avalanche-animate-blur-fade-up inline-flex min-h-11 items-center rounded-full px-6 py-2.5 text-sm font-semibold text-zinc-50 no-underline transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:px-8 sm:py-3"
                    style={revealStyle(700)}
                  >
                    Post an Opportunity
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:justify-end">
                <Link
                  href="/earn/new/talent"
                  className="avalanche-liquid-glass avalanche-animate-blur-fade-up inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-zinc-50 no-underline transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:px-6 sm:py-3"
                  style={revealStyle(800)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                  <span>For Talent</span>
                </Link>
                <Link
                  href="/earn/new/sponsor"
                  className="avalanche-liquid-glass avalanche-animate-blur-fade-up inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-zinc-50 no-underline transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:px-6 sm:py-3"
                  style={revealStyle(900)}
                >
                  <span>For Teams</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

AvalancheEarnLanding.standalonePage = true;

export default AvalancheEarnLanding;
