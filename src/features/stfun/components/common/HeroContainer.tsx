'use client';

import Link from 'next/link';
import { type ReactNode, useEffect } from 'react';

import { gsap } from '@/lib/gsap';

import AnimatedLogo from './AnimatedLogo';
import PrimaryButton from './PrimaryButton';

interface HeroContainerProps {
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  buttonVisible?: boolean;
  children?: ReactNode;
}

export default function HeroContainer({
  line1 = '',
  line2 = '',
  line3 = 'superteam is the forefront community for web3,',
  line4 = 'powered by solana.',
  buttonVisible = true,
  children,
}: HeroContainerProps) {
  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      '.heading .line span',
      {
        y: 100,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 1.8,
        ease: 'power4.out',
        stagger: 0.15,
      },
    );

    tl.fromTo(
      '.sub-heading',
      { y: 0, opacity: 0 },
      {
        opacity: 1,
        duration: 1.8,
        ease: 'power4.out',
      },
      '-=1.8',
    );

    tl.to('.know-more-button', {
      opacity: 1,
      duration: 1.8,
      ease: 'power4.out',
    });
    tl.to('.slot', { opacity: 1, duration: 1.8, ease: 'power4.out' }, '-=1.8');

    tl.to('.heading .line', {
      position: 'relative',
    });
  }, []);

  return (
    <div className="hero-content flex w-full flex-col items-center justify-start">
      <AnimatedLogo />
      <h1 className="heading font-secondary mt-12 flex w-[320px] flex-col text-center text-[calc(24px+0.5vw)] leading-[1.1] font-semibold tracking-[-4%] whitespace-nowrap text-white md:w-[600px] md:text-[48px]">
        <span className="line relative block h-10 w-full md:h-14">
          <span className="heading-text absolute top-0 left-0 w-full opacity-0">
            {line1}
          </span>
        </span>
        <span className="line relative block h-10 md:h-14">
          <span className="heading-text absolute top-0 left-0 w-full opacity-0">
            {line2}
          </span>
        </span>
      </h1>
      <p className="sub-heading font-primary mt-8 px-4 text-center text-[16px] leading-[1.35] tracking-[-4%] text-white opacity-0 md:text-[20px]">
        <span className="inline sm:block">{line3}</span>
        <span className="inline sm:block">{line4}</span>
      </p>
      {children}
      {buttonVisible && (
        <>
          <PrimaryButton
            href="/"
            className="know-more-button mt-8 w-[149px] text-center opacity-0"
          >
            Join Us
          </PrimaryButton>
          <Link
            href="/"
            className="font-secondary mt-[16px] cursor-pointer text-[14px] font-bold text-white underline"
          >
            Know More
          </Link>
        </>
      )}
    </div>
  );
}
