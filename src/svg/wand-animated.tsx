import { motion } from 'motion/react';
import useMeasure from 'react-use-measure';
import { type ClassNameValue } from 'tailwind-merge';

import { cn } from '@/utils/cn';

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
      className={cn('relative size-20', className)}
      style={{ transformStyle: 'preserve-3d', perspective: '100%' }}
    >
      <motion.div
        className="absolute right-0 left-0 h-full w-full"
        animate={{
          transform: [
            `scale(0.4) translateX(-20%) rotate(35deg) rotateY(0deg) translateZ(${zOuter}px) rotateY(360deg)`,
            `scale(0.4) translateX(-15%) rotate(35deg) rotateY(360deg) translateZ(${zOuter}px) rotateY(0deg)`,
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.div
          animate={{
            transform: ['rotate(0deg)', 'rotate(360deg)'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="h-full w-full"
        >
          <StarPath className={starColor} />
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute right-0 left-0"
        animate={{
          transform: [
            `scale(0.3) translateY(-75%) translateX(55%) rotate(35deg) rotateY(180deg) translateZ(${zMiddle}px) rotateY(540deg)`,
            `scale(0.3) translateY(-75%) translateX(55%) rotate(35deg) rotateY(540deg) translateZ(${zMiddle}px) rotateY(180deg)`,
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.div
          animate={{
            transform: ['rotate(360deg)', 'rotate(0deg)'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <StarPath className={starColor} />
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute right-0 left-0"
        animate={{
          transform: [
            `scale(0.25) translateY(-140%) translateX(140%) rotate(35deg) rotateY(0deg) translateZ(${zInner}px) rotateY(360deg)`,
            `scale(0.25) translateY(-140%) translateX(140%) rotate(35deg) rotateY(360deg) translateZ(${zInner}px) rotateY(0deg)`,
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.div
          animate={{
            transform: ['rotate(360deg)', 'rotate(0deg)'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <StarPath className={starColor} />
        </motion.div>
      </motion.div>

      <StickPath color={stickColor} />
    </div>
  );
};

const StarPath = ({ className }: { className?: ClassNameValue }) => (
  <div
    className={cn('aspect-[0.9588] h-full w-full', className)}
    style={{
      clipPath:
        'polygon(3.906% 44.375%, 3.906% 44.375%, 3.227% 44.681%, 2.6% 45.060%, 2.029% 45.508%, 1.519% 46.017%, 1.074% 46.582%, 0.7% 47.195%, 0.401% 47.850%, 0.181% 48.540%, 0.046% 49.258%, 0% 50.000%, 0% 50.000%, 0.046% 50.742%, 0.181% 51.460%, 0.401% 52.150%, 0.7% 52.805%, 1.074% 53.418%, 1.519% 53.983%, 2.029% 54.492%, 2.6% 54.940%, 3.227% 55.319%, 3.906% 55.625%, 33.333% 66.667%, 44.375% 96.093%, 44.375% 96.093%, 44.68% 96.773%, 45.06% 97.400%, 45.508% 97.971%, 46.018% 98.481%, 46.582% 98.926%, 47.195% 99.300%, 47.85% 99.600%, 48.54% 99.819%, 49.259% 99.954%, 50% 100.000%, 50% 100.000%, 50.741% 99.954%, 51.46% 99.819%, 52.15% 99.600%, 52.805% 99.300%, 53.418% 98.926%, 53.983% 98.481%, 54.492% 97.971%, 54.94% 97.400%, 55.32% 96.773%, 55.625% 96.093%, 66.667% 66.667%, 96.094% 55.625%, 96.094% 55.625%, 96.773% 55.319%, 97.4% 54.940%, 97.971% 54.492%, 98.481% 53.983%, 98.926% 53.418%, 99.3% 52.805%, 99.599% 52.150%, 99.819% 51.460%, 99.954% 50.742%, 100% 50.000%, 100% 50.000%, 99.954% 49.258%, 99.819% 48.540%, 99.599% 47.850%, 99.3% 47.195%, 98.926% 46.582%, 98.481% 46.017%, 97.971% 45.508%, 97.4% 45.060%, 96.773% 44.681%, 96.094% 44.375%, 66.667% 33.333%, 55.625% 3.907%, 55.625% 3.907%, 55.32% 3.227%, 54.94% 2.600%, 54.492% 2.029%, 53.983% 1.519%, 53.418% 1.074%, 52.805% 0.700%, 52.15% 0.400%, 51.46% 0.181%, 50.741% 0.047%, 50% 0.000%, 50% 0.000%, 49.259% 0.047%, 48.54% 0.181%, 47.85% 0.400%, 47.195% 0.700%, 46.582% 1.074%, 46.018% 1.519%, 45.508% 2.029%, 45.06% 2.600%, 44.68% 3.227%, 44.375% 3.907%, 33.333% 33.333%, 3.906% 44.375%)',
    }}
  />
);

const StickPath = ({ color }: { color?: ClassNameValue }) => (
  <div
    className={cn('h-full w-full', color)}
    style={{
      clipPath: `polygon(2.627% 77.234%,2.627% 77.234%,1.681% 78.395%,0.946% 79.664%,0.420% 81.017%,0.105% 82.424%,0.000% 83.860%,0.105% 85.296%,0.420% 86.706%,0.946% 88.061%,1.681% 89.334%,2.627% 90.501%,9.109% 97.260%,9.109% 97.260%,10.221% 98.246%,11.439% 99.014%,12.735% 99.561%,14.085% 99.890%,15.461% 100.000%,16.838% 99.890%,18.190% 99.561%,19.489% 99.014%,20.711% 98.246%,21.828% 97.260%,93.256% 22.746%,93.256% 22.746%,94.202% 21.586%,94.938% 20.316%,95.463% 18.964%,95.778% 17.556%,95.884% 16.121%,95.778% 14.684%,95.463% 13.275%,94.938% 11.919%,94.202% 10.646%,93.256% 9.480%,86.775% 2.740%,86.775% 2.740%,85.662% 1.754%,84.445% 0.986%,83.148% 0.439%,81.798% 0.110%,80.422% 0.000%,79.045% 0.110%,77.693% 0.439%,76.394% 0.986%,75.172% 1.754%,74.055% 2.740%,2.627% 77.234%,84.770% 16.123%,65.101% 36.637%,60.736% 32.085%,80.406% 11.571%,84.770% 16.123%)`,
    }}
  />
);
