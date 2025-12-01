'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import localFont from 'next/font/local';
import { type CSSProperties, useEffect, useState } from 'react';

import FaCheck from '@/components/icons/FaCheck';
import FaXTwitter from '@/components/icons/FaXTwitter';
import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { userStatsQuery } from '@/features/home/queries/user-stats';
import { useProUpgradeFlow } from '@/features/pro/state/pro-upgrade-flow';

import { LargeRandomArrow } from './LargeRandomArrow';
import { ProBadge } from './ProBadge';

const celebratoryFont = localFont({
  src: '../../../../public/PerfectlyNineties.otf',
  variable: '--font-perfectly-nineties',
  preload: false,
});

const CONFETTI_PIECE_COUNT = 300;

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
  // Pre-calculated values for Safari optimization
  readonly tiltXMid: number;
  readonly tiltYMid: number;
  readonly rotationMid: number;
  readonly rotation75: number;
  readonly rotationEndFinal: number;
  readonly tiltXEndNeg05: number;
  readonly tiltYEndNeg03: number;
  readonly fall40: number;
  readonly fall78: number;
  readonly swayNeg04: number;
  readonly scale96: number;
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
  '--tilt-x-mid': string;
  '--tilt-y-mid': string;
  '--rotation-mid': string;
  '--rotation-75': string;
  '--rotation-end-final': string;
  '--tilt-x-end-neg-05': string;
  '--tilt-y-end-neg-03': string;
  '--fall-40': string;
  '--fall-78': string;
  '--sway-neg-04': string;
  '--scale-96': string;
};

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

const generateConfettiPieces = (count: number): readonly ConfettiPiece[] => {
  return Array.from({ length: count }).map((_, index) => {
    const rotationStart = randomBetween(-180, 180);
    const rotationEnd = randomBetween(-180, 180);
    const tiltXStart = randomBetween(-180, 180);
    const tiltXEnd = randomBetween(-180, 180);
    const tiltYStart = randomBetween(-180, 180);
    const tiltYEnd = randomBetween(-180, 180);
    const spinDirection = Math.random() > 0.5 ? 1 : -1;
    const scale = randomBetween(0.75, 1.25);
    const sway = randomBetween(12, 36) * (Math.random() > 0.5 ? 1 : -1);
    const fallDistance = randomBetween(95, 135);

    return {
      id: index,
      startX: Math.random() * 100,
      delay: Math.random() * 2000,
      duration: randomBetween(2400, 3600),
      rotationStart,
      rotationEnd,
      scale,
      drift: randomBetween(-180, 180),
      sway,
      fallDistance,
      tiltXStart,
      tiltXEnd,
      tiltYStart,
      tiltYEnd,
      spinDirection,
      tiltXMid: tiltXStart * 0.7 + tiltXEnd * 0.3,
      tiltYMid: tiltYStart * 0.5 + tiltYEnd * 0.5,
      rotationMid: rotationStart + 75 * spinDirection,
      rotation75: rotationEnd * 0.85,
      rotationEndFinal: rotationEnd * 1.25,
      tiltXEndNeg05: tiltXEnd * -0.5,
      tiltYEndNeg03: tiltYEnd * -0.3,
      fall40: fallDistance * 0.4,
      fall78: fallDistance * 0.78,
      swayNeg04: sway * -0.4,
      scale96: scale * 0.96,
    };
  });
};

export const ProBenefitItem = ({ text }: ProBenefitItemProps) => {
  return (
    <div className="flex items-center gap-1 md:gap-3">
      <div className="flex size-4 items-center justify-center rounded-full bg-zinc-600">
        <FaCheck className="size-2 text-zinc-300" />
      </div>
      <span className="text-xs whitespace-nowrap text-zinc-300 md:text-sm">
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
    if (!shouldRunConfetti || typeof window === 'undefined') {
      return;
    }

    let timeoutId: number | undefined;
    let confettiDelayTimeoutId: number | undefined;

    const frameId = window.requestAnimationFrame(() => {
      const pieces = generateConfettiPieces(CONFETTI_PIECE_COUNT);
      setConfettiPieces(pieces);

      confettiDelayTimeoutId = window.setTimeout(() => {
        setIsConfettiActive(true);

        const longestLifetime = pieces.reduce(
          (max, piece) => Math.max(max, piece.delay + piece.duration),
          0,
        );

        timeoutId = window.setTimeout(() => {
          setIsConfettiActive(false);
          setConfettiPieces([]);
        }, longestLifetime + 200);
      }, 1500);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (confettiDelayTimeoutId) {
        window.clearTimeout(confettiDelayTimeoutId);
      }
    };
  }, [shouldRunConfetti]);

  const { originRect } = flow;
  const viewport =
    currentViewport ||
    (flow.viewport
      ? { width: flow.viewport.width, height: flow.viewport.height }
      : null);

  if (!originRect || !viewport) {
    return null;
  }

  return (
    <Dialog
      open={isVisible}
      onOpenChange={(open) => {
        if (!open) {
          reset();
        }
      }}
    >
      <DialogContent
        className="h-full w-full max-w-none border-none bg-black p-0"
        unsetDefaultTransition
        unsetDefaultPosition
        hideCloseIcon
        classNames={{
          overlay: 'bg-black pointer-events-none',
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <AnimatePresence>
          <motion.div
            key="pro-upgrade-overlay"
            className={cn(
              'fixed top-0 left-0 z-10000 flex flex-col items-center justify-center overflow-hidden bg-black',
            )}
            style={{
              width: viewport.width,
              height: viewport.height,
              willChange: 'transform',
              transformOrigin: 'center center',
              contain: 'layout style paint',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              perspective: 1000,
              borderRadius: flow.status === 'expanding' ? '24px' : '0px',
              transition: 'border-radius 0.3s ease-out 0.2s',
            }}
            initial={{
              scaleX: originRect.width / viewport.width,
              scaleY: originRect.height / viewport.height,
              x: originRect.left + originRect.width / 2 - viewport.width / 2,
              y: originRect.top + originRect.height / 2 - viewport.height / 2,
              opacity: 1,
            }}
            animate={{
              scaleX: 1,
              scaleY: 1,
              x: 0,
              y: 0,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: 'easeOut',
              type: 'tween',
            }}
            onAnimationComplete={() => {
              if (flow.status === 'expanding') {
                markFull();
              }
            }}
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
                    '--tilt-x-mid': `${piece.tiltXMid}deg`,
                    '--tilt-y-mid': `${piece.tiltYMid}deg`,
                    '--rotation-mid': `${piece.rotationMid}deg`,
                    '--rotation-75': `${piece.rotation75}deg`,
                    '--rotation-end-final': `${piece.rotationEndFinal}deg`,
                    '--tilt-x-end-neg-05': `${piece.tiltXEndNeg05}deg`,
                    '--tilt-y-end-neg-03': `${piece.tiltYEndNeg03}deg`,
                    '--fall-40': `${piece.fall40}vh`,
                    '--fall-78': `${piece.fall78}vh`,
                    '--sway-neg-04': `${piece.swayNeg04}px`,
                    '--scale-96': (
                      piece.scale96 ?? piece.scale * 0.96
                    ).toString(),
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
            <DialogClose
              className="pointer-events-auto absolute top-4 right-4 z-50 flex size-8 items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-hidden disabled:pointer-events-none"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
            >
              <Cross2Icon className="size-5 text-white" />
              <span className="sr-only">Close</span>
            </DialogClose>
            <div className="relative z-10 flex flex-col items-center px-2">
              <ProBadge
                containerClassName="bg-white/12 px-3 py-1.5 gap-2 mb-4"
                iconClassName="size-2.5 md:size-3 text-white/34"
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
              <p className="mt-4 text-center text-base text-zinc-500 md:mt-6 md:text-xl">
                You are one of the select few who&apos;s eligible
              </p>
              {flow.status === 'full' ? (
                <>
                  <div
                    className="pointer-events-none absolute h-[900px] w-[900px]"
                    style={{
                      top: '5%',
                      left: '10%',
                      background:
                        'radial-gradient(circle, rgba(217, 217, 217, 0.08) 0%, rgba(217, 217, 217, 0.04) 30%, transparent 60%)',
                      transform: 'translate3d(-50%, -50%, 0)',
                      willChange: 'transform',
                    }}
                  />
                  <div
                    className="pointer-events-none absolute h-[900px] w-[900px]"
                    style={{
                      top: '5%',
                      right: '10%',
                      background:
                        'radial-gradient(circle, rgba(217, 217, 217, 0.08) 0%, rgba(217, 217, 217, 0.04) 30%, transparent 60%)',
                      transform: 'translate3d(50%, -50%, 0)',
                      willChange: 'transform',
                    }}
                  />
                  <div
                    className="pointer-events-none absolute h-[900px] w-[900px]"
                    style={{
                      bottom: '5%',
                      left: '10%',
                      background:
                        'radial-gradient(circle, rgba(217, 217, 217, 0.08) 0%, rgba(217, 217, 217, 0.04) 30%, transparent 60%)',
                      transform: 'translate3d(-50%, 50%, 0)',
                      willChange: 'transform',
                    }}
                  />
                  <div
                    className="pointer-events-none absolute h-[900px] w-[900px]"
                    style={{
                      bottom: '5%',
                      right: '10%',
                      background:
                        'radial-gradient(circle, rgba(217, 217, 217, 0.08) 0%, rgba(217, 217, 217, 0.04) 30%, transparent 60%)',
                      transform: 'translate3d(50%, 50%, 0)',
                      willChange: 'transform',
                    }}
                  />
                  <div
                    className="pointer-events-none absolute h-[900px] w-[900px]"
                    style={{
                      top: '50%',
                      left: '50%',
                      background:
                        'radial-gradient(circle, rgba(217, 217, 217, 0.08) 0%, rgba(217, 217, 217, 0.04) 30%, transparent 60%)',
                      transform: 'translate3d(-50%, -50%, 0)',
                      willChange: 'transform',
                    }}
                  />
                  <LargeRandomArrow />
                </>
              ) : null}

              <div className="relative mt-8 w-full overflow-hidden rounded-2xl border border-white/15 p-1 md:mt-10 md:w-100 md:p-2">
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
                    className="absolute right-20 -bottom-20 scale-75 md:-bottom-15 md:scale-80"
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
                        <stop
                          offset="1"
                          stop-color="#FFFEFE"
                          stop-opacity="0"
                        />
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
                      <p className="mt-3 text-xl font-medium md:text-xl">
                        <span className="bg-linear-to-r from-white to-white/44 bg-clip-text text-transparent">
                          {user?.firstName} {user?.lastName}
                        </span>
                      </p>
                    </div>
                    <ProBadge
                      containerClassName="bg-white/12 px-2 py-1 gap-2"
                      iconClassName="size-3 text-white/34"
                      textClassName="text-xs text-white"
                    />
                  </div>
                  {stats && (
                    <div className="mt-8 flex justify-between gap-4 pt-10 pb-6 md:gap-6 md:pt-12">
                      <div>
                        <p className="text-lg font-medium text-white">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(stats.totalWinnings ?? 0)}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-400">
                          Total Earned
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">
                          {stats.wins ?? 0}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-400">Wins</p>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">
                          {stats.participations ?? 0}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-400">
                          Participated
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 px-6 md:mt-8 md:gap-x-22 md:gap-y-6 md:px-6">
                <ProBenefitItem text="Exclusive Bounties" />
                <ProBenefitItem text="High Ticket Prizes" />
                <ProBenefitItem text="Ecosystem Perks" />
                <ProBenefitItem text="Priority Support" />
              </div>
              <div className="mt-10 flex w-full items-center justify-center gap-10 md:w-auto md:gap-16">
                <button
                  className="pointer-events-auto flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm text-black transition-opacity hover:opacity-90 md:px-12 md:text-base"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user?.username) {
                      return;
                    }

                    const shareUrl = `${getURL()}t/${user.username}/pro`;
                    const message = `Hanging out with the 1% on @SuperteamEarn`;
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;

                    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <FaXTwitter className="size-5" />
                  <span className="font-medium">Post on X</span>
                </button>
                <a
                  href="https://x.com/SuperteamEarn/status/1995480188411646253"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto pr-8 text-sm text-zinc-400 underline transition-colors hover:text-white md:text-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  Learn More
                </a>
              </div>
            </div>
            {isVisible ? (
              <audio
                src={'/assets/JohnCenaEntry.mp3'}
                style={{ display: 'none' }}
                autoPlay
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
      <style jsx global>{`
        .pro-confetti-layer {
          perspective: 1200px;
          transform-style: preserve-3d;
          will-change: contents;
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
          transform-origin: center center;
          transform-style: preserve-3d;
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
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
          transform: translateZ(0);
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
        }

        @keyframes pro-confetti-fall {
          0% {
            transform: translate3d(0, -40px, 0) rotateX(var(--tilt-x-start))
              rotateY(var(--tilt-y-start)) rotateZ(var(--rotation-start))
              scale3d(var(--scale), var(--scale), 1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          45% {
            transform: translate3d(var(--sway-neg-04), var(--fall-40), 30px)
              rotateX(var(--tilt-x-mid)) rotateY(var(--tilt-y-mid))
              rotateZ(var(--rotation-mid))
              scale3d(var(--scale), var(--scale), 1);
          }
          75% {
            transform: translate3d(var(--sway), var(--fall-78), -20px)
              rotateX(var(--tilt-x-end)) rotateY(var(--tilt-y-end))
              rotateZ(var(--rotation-75))
              scale3d(var(--scale-96), var(--scale-96), 1);
            opacity: 0.85;
          }
          100% {
            transform: translate3d(var(--drift), var(--fall-distance), 0)
              rotateX(var(--tilt-x-end-neg-05))
              rotateY(var(--tilt-y-end-neg-03))
              rotateZ(var(--rotation-end-final))
              scale3d(var(--scale), var(--scale), 1);
            opacity: 0;
          }
        }
      `}</style>
    </Dialog>
  );
};
