'use client';

import { AnimatePresence, motion } from 'motion/react';
import localFont from 'next/font/local';
import { type CSSProperties, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import FaCheck from '@/components/icons/FaCheck';
import FaXTwitter from '@/components/icons/FaXTwitter';
import { cn } from '@/utils/cn';

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
      <div className="flex size-6 items-center justify-center rounded-full bg-zinc-600">
        <FaCheck className="size-3 text-white" />
      </div>
      <span className="text-lg text-zinc-300">{text}</span>
    </div>
  );
};

export const ProUpgradeOverlay = () => {
  const { flow, markFull, reset } = useProUpgradeFlow();
  const isVisible =
    !!flow.originRect &&
    !!flow.viewport &&
    (flow.status === 'expanding' || flow.status === 'full');
  const [confettiPieces, setConfettiPieces] = useState<
    readonly ConfettiPiece[]
  >([]);
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const shouldRunConfetti = isVisible && flow.status === 'full';
  const showConfetti =
    shouldRunConfetti && isConfettiActive && confettiPieces.length > 0;

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

  const { originRect, viewport } = flow;

  return createPortal(
    <AnimatePresence>
      {originRect && viewport ? (
        <>
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
              <div className="pro-confetti-layer pointer-events-none absolute inset-0 z-0 overflow-hidden">
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
                containerClassName="bg-white/12 px-4 py-2 gap-2 mb-10"
                iconClassName="size-4 text-white/34"
                textClassName="text-sm text-white"
              />
              <div
                className={cn(
                  'pointer-events-none px-6 text-center text-3xl text-white md:text-6xl',
                  celebratoryFont.className,
                )}
              >
                You&apos;ve been
                <br />
                upgraded to Pro
              </div>
              <p className="mt-10 text-3xl text-zinc-500">
                You are one of the select few that are eligible
              </p>
              <div className="mt-12 grid grid-cols-2 gap-6 px-6">
                <ProBenefitItem text="Exclusive Bounties" />
                <ProBenefitItem text="High Ticket Prizes" />
                <ProBenefitItem text="Ecosystem Perks" />
                <ProBenefitItem text="Priority Support" />
              </div>
              <div className="mt-10 flex items-center gap-4">
                <button
                  className="pointer-events-auto flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-black transition-opacity hover:opacity-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement post on X functionality
                  }}
                >
                  <FaXTwitter className="size-5" />
                  <span className="font-medium">Post on X</span>
                </button>
                <a
                  href="#"
                  className="pointer-events-auto text-zinc-400 underline transition-colors hover:text-white"
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
              background-image: linear-gradient(
                180deg,
                #756855 0%,
                #dbc39f 100%
              );
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
                  rotateX(
                    calc(var(--tilt-x-start) * 0.7 + var(--tilt-x-end) * 0.3)
                  )
                  rotateY(
                    calc(var(--tilt-y-start) * 0.5 + var(--tilt-y-end) * 0.5)
                  )
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
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};
