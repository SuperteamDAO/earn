import useMeasure from 'react-use-measure';
import { type ClassNameValue } from 'tailwind-merge';

import { cn } from '@/utils/cn';

import styles from './WandAnimated.module.css';

const DESIGN_BASE_PX = 80;
const OFFSETS_AT_DESIGN = {
  outer: 82,
  middle: 102,
  inner: 112,
};
const FACTORS = {
  outer: OFFSETS_AT_DESIGN.outer / DESIGN_BASE_PX,
  middle: OFFSETS_AT_DESIGN.middle / DESIGN_BASE_PX,
  inner: OFFSETS_AT_DESIGN.inner / DESIGN_BASE_PX,
};

export const WandAnimated = ({
  className,
  stickColor = 'bg-black',
  starColor = 'bg-yellow-400',
}: {
  className?: ClassNameValue;
  stickColor?: ClassNameValue;
  starColor?: ClassNameValue;
}) => {
  const [ref, { width = DESIGN_BASE_PX }] = useMeasure();

  const zOuter = width * FACTORS.outer;
  const zMiddle = width * FACTORS.middle;
  const zInner = width * FACTORS.inner;

  return (
    <div
      ref={ref}
      className={cn(styles.root, className)}
      style={{
        ['--wand-z-outer' as any]: `${zOuter}px`,
        ['--wand-z-middle' as any]: `${zMiddle}px`,
        ['--wand-z-inner' as any]: `${zInner}px`,
      }}
    >
      <div className={cn(styles.star, styles.starOuter)}>
        <div className={styles.starSpin}>
          <div className={cn(styles.starClip, starColor)} />
        </div>
      </div>
      <div className={cn(styles.star, styles.starMiddle)}>
        <div className={styles.starSpinReverse}>
          <div className={cn(styles.starClip, starColor)} />
        </div>
      </div>
      <div className={cn(styles.star, styles.starInner)}>
        <div className={styles.starSpinReverse}>
          <div className={cn(styles.starClip, starColor)} />
        </div>
      </div>
      <div className={cn(styles.stick, styles.stickPath, stickColor)} />
    </div>
  );
};
