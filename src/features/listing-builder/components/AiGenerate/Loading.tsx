import { motion } from 'motion/react';

import { easeOutQuad } from '@/utils/easings';

import { SparkleLoading } from './extras/SparkleLoading';
import { TextLightSweep } from './extras/TextLightSweep';

export function AiGenerateLoading() {
  return (
    <div className="flex h-160 flex-col items-center justify-between gap-2 pt-4">
      <motion.div
        className="mt-60 flex flex-col items-center justify-center gap-4"
        key="loading-animation"
        initial={{
          opacity: 0,
          scale: 0.85,
        }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.3, ease: easeOutQuad, delay: 0.1 }}
      >
        <SparkleLoading />
        <TextLightSweep
          text="Generating a preview"
          className="text-primary font-medium"
        />
      </motion.div>
      <motion.div
        className="sticky bottom-0 w-full bg-slate-50 py-2 text-center text-sm font-medium text-slate-500"
        key="loading-footer"
        initial={{
          y: 45,
        }}
        animate={{ y: 0 }}
        exit={{ y: 45 }}
        transition={{ duration: 0.3, ease: easeOutQuad }}
      >
        <p>
          {`Don't close this tab. `} This could take{' '}
          <span className="itlaic font-semibold">~30 seconds</span> to generate
        </p>
      </motion.div>
    </div>
  );
}
