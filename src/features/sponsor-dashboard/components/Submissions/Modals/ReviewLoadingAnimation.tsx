import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { easeOutCubic } from '@/utils/easings';

function SkeletonCard() {
  return (
    <div className="flex items-start space-x-4">
      <Skeleton className="h-14 w-14 rounded-[0.5rem] bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-2/6 rounded-full bg-gray-100" />
          <Skeleton className="h-3 w-4/6 rounded-full bg-gray-100" />
        </div>
        <Skeleton className="h-3 w-full rounded-full bg-gray-100 delay-300" />
        <Skeleton className="h-3 w-full rounded-full bg-gray-100 delay-300" />
      </div>
    </div>
  );
}

function ScannerLine() {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{
        y: ['0%', '100%', '0%'],
      }}
      transition={{
        duration: 3,
        ease: easeOutCubic,
        repeat: Infinity,
        repeatType: 'loop',
      }}
    >
      <div className="relative h-[0.1875rem] w-full">
        <div className="h-full w-full bg-indigo-500" />
        <div className="absolute top-2/4 left-0 h-2 w-2 -translate-y-2/4 rounded-full bg-indigo-500" />
        <div className="absolute top-2/4 right-0 h-2 w-2 -translate-y-2/4 rounded-full bg-indigo-500" />
      </div>
      <motion.div
        animate={{
          rotateX: [90, 180, 90, 0, 90],
        }}
        transition={{
          duration: 3,
          ease: easeOutCubic,
          repeat: Infinity,
          repeatType: 'loop',
          delay: 0.1,
        }}
        style={{ originX: 0.5, originY: 0 }}
        className="absolute inset-0 mx-auto h-2/4 w-[calc(100%-0.7rem)] bg-gradient-to-b from-indigo-500/20 to-indigo-500/0"
      />
    </motion.div>
  );
}

function SkeletonCardsPresence() {
  const [cards, setCards] = useState<number[]>([0, 1, 2]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prevCards) => {
        const newCards = [...prevCards];
        newCards.pop();
        newCards.unshift(Date.now());
        return newCards;
      });
    }, 1250);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="popLayout">
      {cards.map((card) => (
        <motion.div
          key={card}
          layout="position"
          initial={{ opacity: 0, y: -50, scale: 1, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 50, scale: 0.95, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, type: 'spring', bounce: 0 }}
          data-card={card}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export function ReviewLoadingAnimation() {
  return (
    <div className="relative h-56 w-full">
      <div className="flex h-full flex-col justify-between px-4 py-2">
        <SkeletonCardsPresence />
      </div>
      <ScannerLine />
    </div>
  );
}
