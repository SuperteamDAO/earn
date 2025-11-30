'use client';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import localFont from 'next/font/local';
import { type CSSProperties, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import FaCheck from '@/components/icons/FaCheck';
import FaXTwitter from '@/components/icons/FaXTwitter';
import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { userStatsQuery } from '@/features/home/queries/user-stats';
import { useProUpgradeFlow } from '@/features/pro/state/pro-upgrade-flow';

import { ProBadge } from './ProBadge';

const celebratoryFont = localFont({
  src: '../../../../public/PerfectlyNineties.otf',
  variable: '--font-perfectly-nineties',
  preload: false,
});

const CONFETTI_PIECE_COUNT = 100;

interface ProBenefitItemProps {
  text: string;
}

interface ConfettiPiece {
  readonly id: number;
  readonly startX: number;
  readonly delay: number;
  readonly duration: number;
  readonly rotationStart: number;
  readonly rotationEnd: number;
  readonly scale: number;
  readonly drift: number;
  readonly sway: number;
  readonly fallDistance: number;
  readonly tiltXStart: number;
  readonly tiltXEnd: number;
  readonly tiltYStart: number;
  readonly tiltYEnd: number;
  readonly spinDirection: number;
}

type ConfettiPieceStyle = CSSProperties & {
  '--rotation-start': string;
  '--rotation-end': string;
  '--scale': string;
  '--drift': string;
  '--sway': string;
  '--fall-distance': string;
  '--tilt-x-start': string;
  '--tilt-x-end': string;
  '--tilt-y-start': string;
  '--tilt-y-end': string;
  '--spin-direction': string;
};

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

const generateConfettiPieces = (count: number): readonly ConfettiPiece[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: index,
    startX: Math.random() * 100,
    delay: Math.random() * 420,
    duration: randomBetween(2400, 3600),
    rotationStart: randomBetween(-180, 180),
    rotationEnd: randomBetween(-180, 180),
    scale: randomBetween(0.75, 1.25),
    drift: randomBetween(-180, 180),
    sway: randomBetween(12, 36) * (Math.random() > 0.5 ? 1 : -1),
    fallDistance: randomBetween(95, 135),
    tiltXStart: randomBetween(-180, 180),
    tiltXEnd: randomBetween(-180, 180),
    tiltYStart: randomBetween(-180, 180),
    tiltYEnd: randomBetween(-180, 180),
    spinDirection: Math.random() > 0.5 ? 1 : -1,
  }));
};

export const ProBenefitItem = ({ text }: ProBenefitItemProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-4 items-center justify-center rounded-full bg-zinc-600 md:size-6">
        <FaCheck className="size-2 text-white md:size-3" />
      </div>
      <span className="text-sm whitespace-nowrap text-zinc-300 md:text-lg">
        {text}
      </span>
    </div>
  );
};

export const ProUpgradeOverlay = () => {
  const { flow, markFull, reset } = useProUpgradeFlow();
  const { user } = useUser();
  const { data: stats } = useQuery(userStatsQuery);
  const [currentViewport, setCurrentViewport] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const isVisible =
    !!flow.originRect &&
    (flow.status === 'expanding' || flow.status === 'full');

  const [confettiPieces, setConfettiPieces] = useState<
    readonly ConfettiPiece[]
  >([]);
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const shouldRunConfetti = isVisible && flow.status === 'full';
  const showConfetti =
    shouldRunConfetti && isConfettiActive && confettiPieces.length > 0;

  useEffect(() => {
    if (!isVisible || typeof window === 'undefined') {
      return;
    }

    const updateViewport = () => {
      setCurrentViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();

    window.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || typeof document === 'undefined') {
      return;
    }

    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = 'hidden';

    return () => {
      style.overflow = previousOverflow;
    };
  }, [isVisible]);

  useEffect(() => {
    if (!shouldRunConfetti || typeof window === 'undefined') {
      return;
    }

    let timeoutId: number | undefined;

    const frameId = window.requestAnimationFrame(() => {
      const pieces = generateConfettiPieces(CONFETTI_PIECE_COUNT);
      setConfettiPieces(pieces);
      setIsConfettiActive(true);

      const longestLifetime = pieces.reduce(
        (max, piece) => Math.max(max, piece.delay + piece.duration),
        0,
      );

      timeoutId = window.setTimeout(() => {
        setIsConfettiActive(false);
        setConfettiPieces([]);
      }, longestLifetime + 200);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [shouldRunConfetti]);

  if (!isVisible || typeof document === 'undefined') {
    return null;
  }

  const { originRect } = flow;
  const viewport =
    currentViewport ||
    (flow.viewport
      ? { width: flow.viewport.width, height: flow.viewport.height }
      : null);

  if (!originRect || !viewport) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="pro-upgrade-overlay"
        className={cn(
          'fixed top-0 left-0 z-10000 flex flex-col items-center justify-center overflow-hidden bg-black transition-all duration-500 ease-out',
        )}
        initial={{
          width: originRect.width,
          height: originRect.height,
          left: originRect.left,
          top: originRect.top,
          borderRadius: 24,
          opacity: 1,
        }}
        animate={{
          width: viewport.width,
          height: viewport.height,
          left: 0,
          top: 0,
          borderRadius: 0,
          opacity: 1,
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
        onAnimationComplete={() => {
          if (flow.status === 'expanding') {
            markFull();
          }
        }}
        onClick={reset}
      >
        {showConfetti ? (
          <div className="pro-confetti-layer pointer-events-none absolute inset-0 z-100 overflow-hidden">
            {confettiPieces.map((piece) => {
              const style: ConfettiPieceStyle = {
                left: `${piece.startX}%`,
                animationDelay: `${piece.delay}ms`,
                animationDuration: `${piece.duration}ms`,
                '--rotation-start': `${piece.rotationStart}deg`,
                '--rotation-end': `${piece.rotationEnd}deg`,
                '--scale': piece.scale.toString(),
                '--drift': `${piece.drift}px`,
                '--sway': `${piece.sway}px`,
                '--fall-distance': `${piece.fallDistance}vh`,
                '--tilt-x-start': `${piece.tiltXStart}deg`,
                '--tilt-x-end': `${piece.tiltXEnd}deg`,
                '--tilt-y-start': `${piece.tiltYStart}deg`,
                '--tilt-y-end': `${piece.tiltYEnd}deg`,
                '--spin-direction': `${piece.spinDirection}`,
              };

              return (
                <span
                  key={piece.id}
                  className="pro-confetti-piece"
                  style={style}
                >
                  <span className="pro-confetti-face" />
                </span>
              );
            })}
          </div>
        ) : null}
        <div className="relative z-10 flex flex-col items-center">
          <ProBadge
            containerClassName="bg-white/12 px-3 md:px-4 py-1.5 md:py-2 gap-2 md:mb-10 mb-4"
            iconClassName="size-2.5 md:size-4 text-white/34"
            textClassName="text-xxs text-white md:text-sm"
          />
          <div
            className={cn(
              'pointer-events-none px-6 text-center text-4xl text-white md:text-6xl',
              celebratoryFont.className,
            )}
          >
            You&apos;ve been
            <br />
            upgraded to Pro
          </div>
          <p className="mt-2 text-center text-sm text-zinc-500 md:mt-6 md:text-2xl">
            You are one of the select few that are eligible
          </p>
          <div className="absolute -top-30 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[#d9d9d9]/20 blur-[150px]" />
          <div className="absolute -bottom-30 left-200 size-96 -translate-x-1/2 rounded-full bg-[#d9d9d9]/20 blur-[150px]" />
          <div className="absolute right-200 -bottom-30 size-96 -translate-x-1/2 rounded-full bg-[#d9d9d9]/20 blur-[150px]" />
          <div className="absolute -top-30 right-100 size-96 -translate-x-1/2 rounded-full bg-[#d9d9d9]/20 blur-[150px]" />
          <div className="absolute bottom-30 left-100 size-96 -translate-x-1/2 rounded-full bg-[#d9d9d9]/20 blur-[150px]" />

          <div className="relative mt-10 w-full overflow-hidden rounded-2xl border border-white/15 p-2 md:mt-16 md:w-130 md:p-3">
            <div
              className="rounded-xl bg-zinc-950 px-3 md:px-6"
              style={{
                boxShadow:
                  '0 3.04px 6.07px 3px rgba(255, 255, 255, 0.15), 0 0 9.11px 5px rgba(0, 0, 0, 0.10)',
              }}
            >
              <svg
                width="177"
                height="278"
                viewBox="0 0 177 278"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute -bottom-20 left-1/2 -translate-x-1/2 scale-75 md:-bottom-10 md:scale-100"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M139.839 9.49177L129.879 52.5933C138.705 56.7964 146.401 62.4761 152.967 69.6332C160.706 77.5944 166.623 87.035 170.72 97.9531C174.817 108.872 176.639 120.814 176.185 133.78L175.842 148.792H47.0276C48.1442 154.274 49.9944 159.279 52.5829 163.805C57.3637 171.767 63.9635 178.021 72.3849 182.571C81.0348 186.892 91.1644 189.054 102.774 189.054C110.741 189.054 118.025 187.803 124.627 185.301C131.228 182.799 138.284 178.477 145.795 172.335L169.013 204.749C162.412 210.664 155.127 215.668 147.16 219.763C139.194 223.63 130.999 226.587 122.578 228.635C114.156 230.681 105.846 231.703 97.6517 231.703C91.789 231.703 86.1513 231.343 80.7376 230.629L69.7962 277.992L28.6567 268.5L40.7005 216.367C28.8485 208.791 19.3774 199.005 12.2919 187.007C4.0968 173.131 0 157.208 0 139.239C8.56593e-05 125.363 2.27759 112.624 6.82903 101.024C11.3819 89.4232 17.7562 79.4147 25.9499 70.9984C34.145 62.355 43.8175 55.7576 54.9708 51.2083C65.3873 46.8367 76.5677 44.4715 88.5096 44.1008L98.699 0L139.839 9.49177ZM92.5314 85.3295C82.5154 85.3295 73.9792 87.2623 66.924 91.1289C60.0939 94.9958 54.859 100.684 51.2167 108.19C49.6026 111.517 48.3476 115.156 47.4488 119.108H130.431V117.743C129.975 111.602 127.927 106.028 124.285 101.024C120.87 96.0198 116.431 92.1529 110.967 89.4233C105.505 86.694 99.3597 85.3296 92.5314 85.3295Z"
                  fill="url(#paint0_linear_1_86)"
                  fill-opacity="0.12"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_1_86"
                    x1="115.823"
                    y1="13.0938"
                    x2="15.6006"
                    y2="284.535"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0.00823332" stop-color="#FFFEFE" />
                    <stop offset="1" stop-color="#FFFEFE" stop-opacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute -top-20 size-96 translate-x-1/2 rounded-full bg-[#d9d9d9]/20 blur-[90px]" />
              <div className="flex items-center justify-between">
                <div>
                  <AnimatedDots
                    dotSize={3}
                    colors={['#a1a1aa']}
                    columns={30}
                    rows={4}
                    spacing={1.5}
                    className="z-10 mt-0.5 opacity-80 transition-colors duration-500"
                  />
                  <p className="mt-3 text-xl font-medium md:text-3xl">
                    <span className="bg-linear-to-r from-white to-white/44 bg-clip-text text-transparent">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </p>
                </div>
                <ProBadge
                  containerClassName="bg-white/12 px-2 py-1 gap-2 md:px-3 md:py-1.5"
                  iconClassName="size-3 text-white/34 md:size-4"
                  textClassName="text-xs text-white md:text-sm"
                />
              </div>
              {stats && (
                <div className="mt-8 flex justify-between gap-4 pt-10 pb-6 md:gap-6 md:pt-20">
                  <div>
                    <p className="text-lg font-medium text-white md:text-2xl">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(stats.totalWinnings ?? 0)}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400 md:mt-1 md:text-base">
                      Total Earned
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white md:text-2xl">
                      {stats.wins ?? 0}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400 md:mt-1 md:text-base">
                      Wins
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white md:text-2xl">
                      {stats.participations ?? 0}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400 md:mt-1 md:text-base">
                      Participated
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 px-6 md:mt-12 md:gap-x-24 md:gap-y-6 md:px-6">
            <ProBenefitItem text="Exclusive Bounties" />
            <ProBenefitItem text="High Ticket Prizes" />
            <ProBenefitItem text="Ecosystem Perks" />
            <ProBenefitItem text="Priority Support" />
          </div>
          <div className="mt-10 flex w-full items-center justify-center gap-10 md:mt-16 md:w-auto md:gap-24">
            <button
              className="pointer-events-auto flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm text-black transition-opacity hover:opacity-90 md:px-20 md:text-base"
              onClick={(e) => {
                e.stopPropagation();
                if (!user?.username) {
                  return;
                }

                const shareUrl = `${getURL()}t/${user.username}/pro`;
                const message = `🎉 I just upgraded to Pro on @SuperteamEarn! Check out my profile`;
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;

                window.open(twitterUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              <FaXTwitter className="size-5" />
              <span className="font-medium">Post on X</span>
            </button>
            <a
              href="#"
              className="pointer-events-auto text-sm text-zinc-400 underline transition-colors hover:text-white md:text-base"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement learn more functionality
              }}
            >
              Learn More
            </a>
          </div>
        </div>
      </motion.div>
      <style jsx global>{`
        .pro-confetti-layer {
          perspective: 1200px;
          transform-style: preserve-3d;
        }

        .pro-confetti-piece {
          position: absolute;
          top: -8%;
          width: 14px;
          height: 50px;
          opacity: 0;
          animation-name: pro-confetti-fall;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
          transform-origin: center;
          transform-style: preserve-3d;
          will-change: transform, opacity;
        }

        .pro-confetti-face {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 2px;
          background-image: linear-gradient(180deg, #756855 0%, #dbc39f 100%);
          box-shadow:
            inset 0 0 12px rgba(255, 255, 255, 0.25),
            0 8px 16px rgba(0, 0, 0, 0.45);
          position: relative;
        }

        .pro-confetti-face::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.3),
            transparent 60%
          );
          mix-blend-mode: screen;
        }

        @keyframes pro-confetti-fall {
          0% {
            transform: translate3d(0, -40px, 0) rotateX(var(--tilt-x-start))
              rotateY(var(--tilt-y-start)) rotateZ(var(--rotation-start))
              scale(var(--scale));
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          45% {
            transform: translate3d(
                calc(var(--sway) * -0.4),
                calc(var(--fall-distance) * 0.4),
                30px
              )
              rotateX(calc(var(--tilt-x-start) * 0.7 + var(--tilt-x-end) * 0.3))
              rotateY(calc(var(--tilt-y-start) * 0.5 + var(--tilt-y-end) * 0.5))
              rotateZ(
                calc(var(--rotation-start) + 75deg * var(--spin-direction))
              )
              scale(var(--scale));
          }
          75% {
            transform: translate3d(
                var(--sway),
                calc(var(--fall-distance) * 0.78),
                -20px
              )
              rotateX(var(--tilt-x-end)) rotateY(var(--tilt-y-end))
              rotateZ(calc(var(--rotation-end) * 0.85))
              scale(calc(var(--scale) * 0.96));
            opacity: 0.85;
          }
          100% {
            transform: translate3d(var(--drift), var(--fall-distance), 0)
              rotateX(calc(var(--tilt-x-end) * -0.5))
              rotateY(calc(var(--tilt-y-end) * -0.3))
              rotateZ(calc(var(--rotation-end) * 1.25)) scale(var(--scale));
            opacity: 0;
          }
        }
      `}</style>
    </AnimatePresence>,
    document.body,
  );
};
