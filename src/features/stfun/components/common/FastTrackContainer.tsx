'use client';

import { type ReactNode, useEffect } from 'react';

import { gsap } from '@/lib/gsap';

interface FastTrackContainerProps {
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  children?: ReactNode;
}

export default function FastTrackContainer({
  line1 = '',
  line2 = '',
  line3 = 'superteam is the forefront community for web3,',
  line4 = 'powered by solana.',
  children,
}: FastTrackContainerProps) {
  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      '.fast-track-heading .line span',
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
      '.fast-track-sub-heading',
      { y: 0, opacity: 0 },
      {
        opacity: 1,
        duration: 1.8,
        ease: 'power4.out',
      },
      '-=1.8',
    );

    tl.to('.fast-track-heading .line', {
      position: 'relative',
    });
  }, []);

  return (
    <div className="fast-track-hero-content flex w-full flex-col items-center">
      <h1 className="fast-track-heading font-secondary mt-12 flex w-[320px] flex-col text-center text-[calc(24px+0.5vw)] leading-[1.005] font-semibold tracking-[-4%] whitespace-nowrap text-white md:w-[600px] md:text-[48px]">
        <span className="line relative block h-9 w-full overflow-hidden md:h-12">
          <span className="heading-text absolute top-0 left-0 w-full opacity-0">
            {line1}
          </span>
        </span>
        <span className="line relative block h-9 overflow-hidden md:h-12">
          <span className="heading-text absolute top-0 left-0 w-full opacity-0">
            {line2}
          </span>
        </span>
      </h1>
      <p className="fast-track-sub-heading font-primary mt-8 text-center text-[16px] leading-[1.35] tracking-[-4%] text-white opacity-0 md:text-[20px]">
        <span className="inline sm:block">{line3}</span>
        <span className="inline sm:block">{line4}</span>
      </p>
      {children}
    </div>
  );
}
