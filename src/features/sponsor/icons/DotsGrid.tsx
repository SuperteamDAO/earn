import React, { useEffect, useRef, useState } from 'react';

type Dot = {
  cx: number;
  cy: number;
  baseOpacity: number;
};

const WIDTH = 231;
const HEIGHT = 50;

const RX = 2.27273 as const;
const RY = 2.17267 as const;

const FILL_COLOR = 'black';
const FILL_OPACITY = 0.8;

const MIN_OPACITY = 0.1;
const MAX_OPACITY = 0.6;

const RANGE = 1;

function easeInOutSine(t: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const DOTS: Dot[] = [
  { cx: 228.13, cy: 2.27273, baseOpacity: 0.06 },
  { cx: 228.13, cy: 11.3635, baseOpacity: 0.23 },
  { cx: 228.13, cy: 20.4544, baseOpacity: 0.32 },
  { cx: 228.13, cy: 29.5457, baseOpacity: 0.49 },
  { cx: 228.13, cy: 38.6365, baseOpacity: 0.44 },
  { cx: 228.13, cy: 47.7273, baseOpacity: 0.45 },
  { cx: 219.439, cy: 2.27273, baseOpacity: 0.27 },
  { cx: 219.439, cy: 11.3635, baseOpacity: 0.06 },
  { cx: 219.439, cy: 20.4544, baseOpacity: 0.21 },
  { cx: 219.439, cy: 29.5457, baseOpacity: 0.54 },
  { cx: 219.439, cy: 38.6365, baseOpacity: 0.35 },
  { cx: 219.439, cy: 47.7273, baseOpacity: 0.1 },
  { cx: 210.749, cy: 2.27273, baseOpacity: 0.23 },
  { cx: 210.749, cy: 11.3635, baseOpacity: 0.31 },
  { cx: 210.749, cy: 20.4544, baseOpacity: 0.33 },
  { cx: 210.749, cy: 29.5457, baseOpacity: 0.34 },
  { cx: 210.749, cy: 38.6365, baseOpacity: 0.09 },
  { cx: 210.749, cy: 47.7273, baseOpacity: 0.23 },
  { cx: 202.058, cy: 2.27273, baseOpacity: 0.29 },
  { cx: 202.058, cy: 11.3635, baseOpacity: 0.11 },
  { cx: 202.058, cy: 20.4544, baseOpacity: 0.08 },
  { cx: 202.058, cy: 29.5457, baseOpacity: 0.29 },
  { cx: 202.058, cy: 38.6365, baseOpacity: 0.1 },
  { cx: 202.058, cy: 47.7273, baseOpacity: 0.06 },
  { cx: 193.368, cy: 2.27273, baseOpacity: 0.13 },
  { cx: 193.368, cy: 11.3635, baseOpacity: 0.18 },
  { cx: 193.368, cy: 20.4544, baseOpacity: 0.46 },
  { cx: 193.368, cy: 29.5457, baseOpacity: 0.23 },
  { cx: 193.368, cy: 38.6365, baseOpacity: 0.16 },
  { cx: 193.368, cy: 47.7273, baseOpacity: 0.47 },
  { cx: 184.677, cy: 2.27273, baseOpacity: 0.18 },
  { cx: 184.677, cy: 11.3635, baseOpacity: 0.29 },
  { cx: 184.677, cy: 20.4544, baseOpacity: 0.45 },
  { cx: 184.677, cy: 29.5457, baseOpacity: 0.07 },
  { cx: 184.677, cy: 38.6365, baseOpacity: 0.38 },
  { cx: 184.677, cy: 47.7273, baseOpacity: 0.44 },
  { cx: 175.986, cy: 2.27273, baseOpacity: 0.24 },
  { cx: 175.986, cy: 11.3635, baseOpacity: 0.28 },
  { cx: 175.986, cy: 20.4544, baseOpacity: 0.22 },
  { cx: 175.986, cy: 29.5457, baseOpacity: 0.43 },
  { cx: 175.986, cy: 38.6365, baseOpacity: 0.25 },
  { cx: 175.986, cy: 47.7273, baseOpacity: 0.26 },
  { cx: 167.296, cy: 2.27273, baseOpacity: 0.36 },
  { cx: 167.296, cy: 11.3635, baseOpacity: 0.2 },
  { cx: 167.296, cy: 20.4544, baseOpacity: 0.47 },
  { cx: 167.296, cy: 29.5457, baseOpacity: 0.33 },
  { cx: 167.296, cy: 38.6365, baseOpacity: 0.26 },
  { cx: 167.296, cy: 47.7273, baseOpacity: 0.2 },
  { cx: 158.605, cy: 2.27273, baseOpacity: 0.25 },
  { cx: 158.605, cy: 11.3635, baseOpacity: 0.54 },
  { cx: 158.605, cy: 20.4544, baseOpacity: 0.49 },
  { cx: 158.605, cy: 29.5457, baseOpacity: 0.48 },
  { cx: 158.605, cy: 38.6365, baseOpacity: 0.4 },
  { cx: 158.605, cy: 47.7273, baseOpacity: 0.3 },
  { cx: 149.913, cy: 2.27273, baseOpacity: 0.19 },
  { cx: 149.913, cy: 11.3635, baseOpacity: 0.31 },
  { cx: 149.913, cy: 20.4544, baseOpacity: 0.31 },
  { cx: 149.913, cy: 29.5457, baseOpacity: 0.51 },
  { cx: 149.913, cy: 38.6365, baseOpacity: 0.19 },
  { cx: 149.913, cy: 47.7273, baseOpacity: 0.2 },
  { cx: 141.224, cy: 2.27273, baseOpacity: 0.45 },
  { cx: 141.224, cy: 11.3635, baseOpacity: 0.21 },
  { cx: 141.224, cy: 20.4544, baseOpacity: 0.45 },
  { cx: 141.224, cy: 29.5457, baseOpacity: 0.06 },
  { cx: 141.224, cy: 38.6365, baseOpacity: 0.05 },
  { cx: 141.224, cy: 47.7273, baseOpacity: 0.23 },
  { cx: 132.532, cy: 2.27273, baseOpacity: 0.07 },
  { cx: 132.532, cy: 11.3635, baseOpacity: 0.47 },
  { cx: 132.532, cy: 20.4544, baseOpacity: 0.11 },
  { cx: 132.532, cy: 29.5457, baseOpacity: 0.27 },
  { cx: 132.532, cy: 38.6365, baseOpacity: 0.46 },
  { cx: 132.532, cy: 47.7273, baseOpacity: 0.18 },
  { cx: 123.841, cy: 2.27273, baseOpacity: 0.13 },
  { cx: 123.841, cy: 11.3635, baseOpacity: 0.06 },
  { cx: 123.841, cy: 20.4544, baseOpacity: 0.27 },
  { cx: 123.841, cy: 29.5457, baseOpacity: 0.23 },
  { cx: 123.841, cy: 38.6365, baseOpacity: 0.48 },
  { cx: 123.841, cy: 47.7273, baseOpacity: 0.24 },
  { cx: 115.152, cy: 2.27273, baseOpacity: 0.5 },
  { cx: 115.152, cy: 11.3635, baseOpacity: 0.46 },
  { cx: 115.152, cy: 20.4544, baseOpacity: 0.12 },
  { cx: 115.152, cy: 29.5457, baseOpacity: 0.46 },
  { cx: 115.152, cy: 38.6365, baseOpacity: 0.46 },
  { cx: 115.152, cy: 47.7273, baseOpacity: 0.26 },
  { cx: 106.46, cy: 2.27273, baseOpacity: 0.06 },
  { cx: 106.46, cy: 11.3635, baseOpacity: 0.05 },
  { cx: 106.46, cy: 20.4544, baseOpacity: 0.54 },
  { cx: 106.46, cy: 29.5457, baseOpacity: 0.11 },
  { cx: 106.46, cy: 38.6365, baseOpacity: 0.32 },
  { cx: 106.46, cy: 47.7273, baseOpacity: 0.33 },
  { cx: 97.7707, cy: 2.27273, baseOpacity: 0.22 },
  { cx: 97.7707, cy: 11.3635, baseOpacity: 0.38 },
  { cx: 97.7707, cy: 20.4544, baseOpacity: 0.22 },
  { cx: 97.7707, cy: 29.5457, baseOpacity: 0.2 },
  { cx: 97.7707, cy: 38.6365, baseOpacity: 0.54 },
  { cx: 97.7707, cy: 47.7273, baseOpacity: 0.42 },
  { cx: 89.0793, cy: 2.27273, baseOpacity: 0.28 },
  { cx: 89.0793, cy: 11.3635, baseOpacity: 0.06 },
  { cx: 89.0793, cy: 20.4544, baseOpacity: 0.07 },
  { cx: 89.0793, cy: 29.5457, baseOpacity: 0.47 },
  { cx: 89.0793, cy: 38.6365, baseOpacity: 0.11 },
  { cx: 89.0793, cy: 47.7273, baseOpacity: 0.29 },
  { cx: 80.3879, cy: 2.27273, baseOpacity: 0.52 },
  { cx: 80.3879, cy: 11.3635, baseOpacity: 0.26 },
  { cx: 80.3879, cy: 20.4544, baseOpacity: 0.17 },
  { cx: 80.3879, cy: 29.5457, baseOpacity: 0.47 },
  { cx: 80.3879, cy: 38.6365, baseOpacity: 0.33 },
  { cx: 80.3879, cy: 47.7273, baseOpacity: 0.07 },
  { cx: 71.6984, cy: 2.27273, baseOpacity: 0.35 },
  { cx: 71.6984, cy: 11.3635, baseOpacity: 0.21 },
  { cx: 71.6984, cy: 20.4544, baseOpacity: 0.44 },
  { cx: 71.6984, cy: 29.5457, baseOpacity: 0.32 },
  { cx: 71.6984, cy: 38.6365, baseOpacity: 0.16 },
  { cx: 71.6984, cy: 47.7273, baseOpacity: 0.3 },
  { cx: 63.007, cy: 2.27273, baseOpacity: 0.15 },
  { cx: 63.007, cy: 11.3635, baseOpacity: 0.06 },
  { cx: 63.007, cy: 20.4544, baseOpacity: 0.37 },
  { cx: 63.007, cy: 29.5457, baseOpacity: 0.42 },
  { cx: 63.007, cy: 38.6365, baseOpacity: 0.12 },
  { cx: 63.007, cy: 47.7273, baseOpacity: 0.24 },
  { cx: 54.3176, cy: 2.27273, baseOpacity: 0.5 },
  { cx: 54.3176, cy: 11.3635, baseOpacity: 0.22 },
  { cx: 54.3176, cy: 20.4544, baseOpacity: 0.34 },
  { cx: 54.3176, cy: 29.5457, baseOpacity: 0.54 },
  { cx: 54.3176, cy: 38.6365, baseOpacity: 0.4 },
  { cx: 54.3176, cy: 47.7273, baseOpacity: 0.06 },
  { cx: 45.6262, cy: 2.27273, baseOpacity: 0.09 },
  { cx: 45.6262, cy: 11.3635, baseOpacity: 0.53 },
  { cx: 45.6262, cy: 20.4544, baseOpacity: 0.22 },
  { cx: 45.6262, cy: 29.5457, baseOpacity: 0.18 },
  { cx: 45.6262, cy: 38.6365, baseOpacity: 0.36 },
  { cx: 45.6262, cy: 47.7273, baseOpacity: 0.3 },
  { cx: 36.9348, cy: 2.27273, baseOpacity: 0.29 },
  { cx: 36.9348, cy: 11.3635, baseOpacity: 0.42 },
  { cx: 36.9348, cy: 20.4544, baseOpacity: 0.37 },
  { cx: 36.9348, cy: 29.5457, baseOpacity: 0.54 },
  { cx: 36.9348, cy: 38.6365, baseOpacity: 0.21 },
  { cx: 36.9348, cy: 47.7273, baseOpacity: 0.24 },
  { cx: 28.2453, cy: 2.27273, baseOpacity: 0.24 },
  { cx: 28.2453, cy: 11.3635, baseOpacity: 0.39 },
  { cx: 28.2453, cy: 20.4544, baseOpacity: 0.24 },
  { cx: 28.2453, cy: 29.5457, baseOpacity: 0.21 },
  { cx: 28.2453, cy: 38.6365, baseOpacity: 0.1 },
  { cx: 28.2453, cy: 47.7273, baseOpacity: 0.2 },
  { cx: 19.5539, cy: 2.27273, baseOpacity: 0.11 },
  { cx: 19.5539, cy: 11.3635, baseOpacity: 0.34 },
  { cx: 19.5539, cy: 20.4544, baseOpacity: 0.51 },
  { cx: 19.5539, cy: 29.5457, baseOpacity: 0.53 },
  { cx: 19.5539, cy: 38.6365, baseOpacity: 0.23 },
  { cx: 19.5539, cy: 47.7273, baseOpacity: 0.05 },
  { cx: 10.8625, cy: 2.27273, baseOpacity: 0.22 },
  { cx: 10.8625, cy: 11.3635, baseOpacity: 0.37 },
  { cx: 10.8625, cy: 20.4544, baseOpacity: 0.46 },
  { cx: 10.8625, cy: 29.5457, baseOpacity: 0.52 },
  { cx: 10.8625, cy: 38.6365, baseOpacity: 0.06 },
  { cx: 10.8625, cy: 47.7273, baseOpacity: 0.28 },
  { cx: 2.17303, cy: 2.27273, baseOpacity: 0.39 },
  { cx: 2.17303, cy: 11.3635, baseOpacity: 0.49 },
  { cx: 2.17303, cy: 20.4544, baseOpacity: 0.53 },
  { cx: 2.17303, cy: 29.5457, baseOpacity: 0.34 },
  { cx: 2.17303, cy: 38.6365, baseOpacity: 0.52 },
  { cx: 2.17303, cy: 47.7273, baseOpacity: 0.48 },
];

const pickNewTarget = (base: number) => {
  const range = RANGE * (0.8 + Math.random() * 0.4);
  return clamp(
    base + (Math.random() * 2 - 1) * range,
    MIN_OPACITY,
    MAX_OPACITY,
  );
};

export default function SereneDotGrid() {
  const current = useRef<number[]>(DOTS.map((d) => d.baseOpacity));
  const start = useRef<number[]>(DOTS.map((d) => d.baseOpacity));
  const target = useRef<number[]>(
    DOTS.map((d) => pickNewTarget(d.baseOpacity)),
  );
  const startTime = useRef<number[]>(DOTS.map(() => performance.now()));
  const duration = useRef<number[]>(
    DOTS.map(() => 3500 + Math.random() * 5000),
  );

  const [, setTick] = useState(0);
  const raf = useRef<number | null>(null);
  const lastCommit = useRef<number>(0);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      let changed = false;

      for (let i = 0; i < DOTS.length; i++) {
        const elapsed = now - (startTime.current[i] ?? now);
        const dur = duration.current[i] ?? 1;
        let t = elapsed / dur;

        if (t >= 1) {
          const dot = DOTS[i]!;
          start.current[i] = current.current[i] ?? dot.baseOpacity;
          target.current[i] = pickNewTarget(dot.baseOpacity);
          startTime.current[i] = now;
          duration.current[i] = 3500 + Math.random() * 5000;
          t = 0;
        }

        const k = easeInOutSine(clamp(t, 0, 1));
        const dot = DOTS[i]!;
        const startVal = start.current[i] ?? dot.baseOpacity;
        const targetVal = target.current[i] ?? dot.baseOpacity;
        const next = startVal + (targetVal - startVal) * k;

        if (Math.abs(next - (current.current[i] ?? next)) > 0.0005) {
          current.current[i] = next;
          changed = true;
        }
      }

      // Re-render at most ~20fps to keep CPU low but motion smooth
      if (changed && now - lastCommit.current > 50) {
        setTick((v) => (v + 1) % 1_000_000);
        lastCommit.current = now;
      }

      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox="0 0 231 50"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Serene animated grid of dots"
      style={{ display: 'block' }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {DOTS.map((dot, i) => (
        <ellipse
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          rx={RX}
          ry={RY}
          transform={`rotate(90 ${dot.cx} ${dot.cy})`}
          fill={FILL_COLOR}
          fillOpacity={FILL_OPACITY}
          opacity={current.current[i]}
          filter="url(#glow)"
          style={{ willChange: 'opacity' }}
        />
      ))}
    </svg>
  );
}
