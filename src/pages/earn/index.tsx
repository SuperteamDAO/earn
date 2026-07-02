import { Menu, X } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { type CSSProperties, type ReactElement, useState } from 'react';

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

type StandalonePage = {
  (): ReactElement;
  standalonePage?: boolean;
};

const AvalancheEarnLanding: StandalonePage = function AvalancheEarnLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState(false);
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
          </div>

          <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 text-center sm:px-6 md:px-12 md:pb-16">
            <div className="w-full max-w-5xl">
              <div className="mx-auto max-w-4xl">
                <h1
                  className="avalanche-animate-blur-fade-up mb-6 text-5xl leading-[1.02] font-normal tracking-[-0.04em] text-zinc-50 sm:text-6xl md:text-7xl lg:text-8xl"
                  style={revealStyle(400)}
                >
                  Join the Waitlist
                </h1>

                <p
                  className="avalanche-animate-blur-fade-up mx-auto mb-10 max-w-3xl text-xl leading-relaxed font-semibold text-zinc-300 sm:text-2xl md:text-3xl"
                  style={revealStyle(500)}
                >
                  Get early access to Avalanche Earn, the marketplace for
                  bounties, grants, and project work launching soon.
                </p>

                <form
                  className="avalanche-animate-blur-fade-up mx-auto flex w-full max-w-3xl flex-col gap-4 sm:flex-row"
                  style={revealStyle(650)}
                  onSubmit={(event) => {
                    event.preventDefault();
                    setHasJoinedWaitlist(true);
                  }}
                >
                  <label htmlFor="waitlist-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="waitlist-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@company.com"
                    className="min-h-16 flex-1 rounded-[1.75rem] border border-zinc-500/60 bg-zinc-950/55 px-6 text-lg font-semibold text-zinc-50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-md transition-[border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-zinc-500 focus-visible:border-zinc-200 focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:outline-none sm:min-h-20 sm:rounded-[2rem] sm:px-8 sm:text-2xl"
                  />
                  <button
                    type="submit"
                    className="min-h-16 rounded-[1.75rem] bg-[#e84142] px-8 text-lg font-bold text-zinc-50 transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#ff3536] focus-visible:ring-2 focus-visible:ring-zinc-50/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:min-h-20 sm:rounded-[2rem] sm:px-12 sm:text-2xl"
                  >
                    Get Notified
                  </button>
                </form>
                <p
                  aria-live="polite"
                  className="mt-4 min-h-6 text-sm font-medium text-zinc-300"
                >
                  {hasJoinedWaitlist ? 'Thanks, we will be in touch soon.' : ''}
                </p>
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
