import { CheckIcon, LockIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { cn } from '@/utils/cn';

export function PerkRow({
  active,
  icon,
  title,
  subtitle,
  locked,
  onClick,
  requiredValue,
  currentValue,
  previewVideoSrc,
}: {
  active?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  locked?: boolean;
  onClick?: () => void;
  requiredValue?: number;
  currentValue?: number;
  previewVideoSrc?: string;
}) {
  const [isHover, setIsHover] = useState(false);

  return (
    <motion.div
      className={cn(
        'group relative flex items-center rounded-lg border px-4 py-3 shadow-lg select-none',
        active ? 'border-brand-purple text-slate-500 shadow-indigo-600/10' : '',
        locked ? 'cursor-pointer text-slate-500/60' : '',
      )}
      onClick={onClick}
      layout
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      onHoverStart={() => setIsHover(true)}
      onHoverEnd={() => setIsHover(false)}
      transition={{ type: 'spring', stiffness: 520, damping: 36 }}
    >
      <AnimatePresence>
        {active ? (
          <motion.div
            key="active-ring"
            layoutId="perkActiveRing"
            className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-violet-500/60"
            transition={{ type: 'spring', stiffness: 600, damping: 40 }}
          />
        ) : null}
      </AnimatePresence>

      <div className="mt-1 mr-3 self-start">{icon}</div>
      <div className="mr-auto">
        <p
          className={cn(
            'flex items-center gap-2 text-base font-medium text-slate-600',
            locked ? 'text-slate-500/60' : '',
          )}
        >
          {title}
          {locked ? <LockIcon className="size-4 text-slate-500/60" /> : null}
        </p>
        {subtitle ? <p className="text-sm">{subtitle}</p> : null}
      </div>
      {locked ? (
        <motion.span
          className="text-sm text-blue-600"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.25 }}
        >
          +Add ${(requiredValue! - currentValue!).toLocaleString()}
        </motion.span>
      ) : (
        <AnimatePresence>
          {active ? (
            <motion.div
              key="check"
              className="flex items-center justify-center rounded-full bg-violet-50 p-1.5"
              initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 650, damping: 30 }}
            >
              <CheckIcon className="text-brand-purple size-4" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {previewVideoSrc && isHover ? (
          <motion.div
            key="preview"
            className="pointer-events-none absolute top-1/2 right-full z-50 ml-3 w-80 -translate-y-1/2 overflow-hidden rounded-md border bg-white shadow-xl"
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <video
              src={previewVideoSrc}
              className="h-54 w-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
