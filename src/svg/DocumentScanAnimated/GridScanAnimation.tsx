import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import useMeasure from 'react-use-measure';

import { easeInOutCubic } from '@/utils/easings';

import { Document } from './Document';

const COLOR_PAIRS = [
  { bg: 'var(--color-purple-100)', stroke: 'var(--color-purple-600)' },
  { bg: 'var(--color-cyan-100)', stroke: 'var(--color-cyan-600)' },
  { bg: 'var(--color-red-100)', stroke: 'var(--color-red-600)' },
];

// Animation timing constants
const COLOR_REVEAL_MIN = 1000; // ms
const COLOR_REVEAL_MAX = 2000; // ms
const COLOR_REVEAL_TOTAL = COLOR_REVEAL_MIN + COLOR_REVEAL_MAX; // 3000ms
const FADE_OUT_DURATION = 600; // ms
const LOOP_DELAY = 500; // ms
const EXIT_DELAY = 500; // ms extra delay before exit

function GridScanItem({ index, cycle }: { index: number; cycle: number }) {
  const [colorIdx] = useState(() =>
    Math.floor(Math.random() * COLOR_PAIRS.length),
  );
  const [revealed, setRevealed] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Color reveal
  useEffect(() => {
    setRevealed(false);
    setExiting(false);
    const timeout = setTimeout(
      () => setRevealed(true),
      COLOR_REVEAL_MIN + Math.random() * COLOR_REVEAL_MAX,
    );
    // Schedule exit for all at the same time, with a little delay
    const exitTimeout = setTimeout(
      () => setExiting(true),
      COLOR_REVEAL_TOTAL + EXIT_DELAY,
    );
    return () => {
      clearTimeout(timeout);
      clearTimeout(exitTimeout);
    };
  }, [cycle]);

  const { bg, stroke } = COLOR_PAIRS[colorIdx]!;

  return (
    <motion.div
      key={`${cycle}-${index}`}
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={
        exiting
          ? { opacity: 0, scale: 0.9, y: 10 }
          : { opacity: 1, scale: 1, y: 0 }
      }
      transition={{
        opacity: {
          duration: exiting ? FADE_OUT_DURATION / 1000 : 0.5,
          delay: exiting ? 0 : index * 0.06,
        },
        scale: {
          duration: exiting ? FADE_OUT_DURATION / 1000 : 0.5,
          delay: exiting ? 0 : index * 0.06,
        },
        y: {
          duration: exiting ? FADE_OUT_DURATION / 1000 : 0.5,
          delay: exiting ? 0 : index * 0.06,
        },
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className="relative flex items-center justify-center overflow-hidden rounded-lg p-2 transition-colors duration-700"
      style={{
        background: revealed ? bg : 'var(--color-slate-50)',
        transition: 'background 0.7s',
      }}
    >
      <Document
        className="!size-10"
        styles={{ stroke: revealed ? stroke : 'var(--color-slate-300)' }}
      />
    </motion.div>
  );
}

/**
 * Renders a 6x4 grid of Document icons for scan animation, with a glowing scanner line.
 */
export function GridScanAnimation() {
  const rows = 4;
  const cols = 6;
  const grid = Array.from({ length: rows * cols });
  const [direction, setDirection] = useState<'down' | 'up' | null>(null);
  const [gridRef, { height: gridHeight = 0 }] = useMeasure();
  const [cycle, setCycle] = useState(0);

  // Scanner animation keyframes
  const scannerVariants = {
    down: { y: 0 },
    up: { y: gridHeight },
  };

  // Start the scanner immediately on mount
  useEffect(() => {
    setDirection('up');
  }, []);

  // Alternate direction on each animation cycle
  useEffect(() => {
    if (!direction) return;
    const timeout = setTimeout(() => {
      setDirection((d) => (d === 'down' ? 'up' : 'down'));
    }, 1800);
    return () => clearTimeout(timeout);
  }, [direction]);

  // Loop the grid animation
  useEffect(() => {
    const loopTimeout = setTimeout(
      () => {
        setCycle((c) => c + 1);
      },
      COLOR_REVEAL_TOTAL + FADE_OUT_DURATION + LOOP_DELAY,
    );
    return () => clearTimeout(loopTimeout);
  }, [cycle]);

  return (
    <div className="relative mx-auto w-fit">
      {/* Scanner line */}
      <motion.div
        className="pointer-events-none absolute left-0 h-1 w-full rounded bg-blue-400 opacity-80 shadow-md"
        style={{
          top: 0,
          zIndex: 10,
          boxShadow: '0 0 16px 4px #60a5fa, 0 0 32px 8px #fff',
        }}
        animate={direction ?? 'down'}
        variants={scannerVariants}
        transition={{ duration: 1.8, ease: easeInOutCubic }}
      />
      {/* Grid */}
      <div
        ref={gridRef}
        className="mx-auto grid w-fit grid-cols-6 grid-rows-4 gap-3 overflow-hidden"
      >
        {grid.map((_, i) => (
          <GridScanItem key={`${cycle}-${i}`} index={i} cycle={cycle} />
        ))}
      </div>
    </div>
  );
}
