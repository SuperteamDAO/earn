'use client';

import { X } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { gsap } from '@/lib/gsap';
import { cn } from '@/utils/cn';

import { useClickOutside } from '@/features/stfun/hooks/useClickOutside';

import MenuButtons from './MenuButtons';
import NamedLogo from './NamedLogo';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [menuPos, setMenuPos] = useState(-192);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const openMenu = () => {
    setMenuPos(-32);
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuPos(-192);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  useClickOutside(menuRef, closeMenu, isMenuOpen);

  // Animate header on mount - direct DOM animation for better performance
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -100 },
        { y: 0, duration: 1.8, ease: 'expo.out' },
      );
    }
  }, []);

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMenuOpen) {
        closeMenu();
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events, isMenuOpen]);

  return (
    <header
      ref={headerRef}
      className={cn(
        'relative z-10 col-span-5 mt-8 flex w-full items-center justify-between',
        className,
      )}
      style={{ transform: 'translateY(-100px)' }}
    >
      <Link href="/" aria-label="superteam">
        <NamedLogo />
      </Link>

      <div className="hidden md:inline">
        <MenuButtons />
      </div>

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className="st-header-dropdown fixed top-0 left-0 z-50 flex h-[160px] w-full pt-8 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden"
        style={{ transform: `translateY(${menuPos}px)` }}
      >
        <div className="flex flex-1 flex-col items-center">
          <MenuButtons />
          <button
            onClick={toggleMenu}
            className="mt-8 px-8 text-white"
            aria-label="Close button"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="inline md:hidden"
        aria-label="Menu button"
      >
        <svg
          width="25"
          height="13"
          viewBox="0 0 25 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.320312 1.00781H24.3825"
            stroke="white"
            strokeWidth="2.00518"
          />
          <path
            d="M0.320312 11.0337H24.3825"
            stroke="white"
            strokeWidth="2.00518"
          />
        </svg>
      </button>
    </header>
  );
}
