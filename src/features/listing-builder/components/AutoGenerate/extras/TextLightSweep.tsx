import { motion } from 'motion/react';

import { cn } from '@/utils/cn';
import { easeOutQuad } from '@/utils/easings';

export function TextLightSweep({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <motion.p className={cn('relative', className)}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: easeOutQuad,
            delay: index * 0.1,
          }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}

      {/* Light sweep effect overlay */}
      <motion.span
        className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: ['0%', '200%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: easeOutQuad,
        }}
        style={{
          WebkitMaskImage:
            'linear-gradient(to right, transparent, white, transparent)',
        }}
      />
    </motion.p>
  );
}
