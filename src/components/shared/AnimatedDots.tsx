import { useState } from 'react';
import { type ClassNameValue } from 'tailwind-merge';

import { cn } from '@/utils/cn';

interface AnimatedDotsProps {
  readonly dotSize: number;
  readonly colors: string[];
  readonly columns?: number;
  readonly rows?: number;
  readonly spacing?: number;
  readonly className?: ClassNameValue;
}

interface DotConfig {
  readonly color: string;
  readonly delay: number;
  readonly duration: number;
}

export function AnimatedDots({
  dotSize,
  colors,
  columns = 20,
  rows = 6,
  spacing = 1.5,
  className,
}: AnimatedDotsProps) {
  const dots = useState<DotConfig[]>(() => {
    const totalDots = columns * rows;
    return Array.from({ length: totalDots }, () => {
      const colorIndex = Math.floor(Math.random() * colors.length);
      const delay = Math.random() * 2;
      const duration = 1.5 + Math.random() * 1.5;

      return {
        color: colors[colorIndex % colors.length]!,
        delay,
        duration,
      };
    });
  })[0];

  const gap = dotSize * (spacing - 1);

  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, ${dotSize}px)`,
        gap: `${gap}px`,
        width: 'fit-content',
      }}
    >
      {dots.map((dot, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: dot.color,
            animation: `pulse ${dot.duration}s ease-in-out infinite`,
            animationDelay: `${dot.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
