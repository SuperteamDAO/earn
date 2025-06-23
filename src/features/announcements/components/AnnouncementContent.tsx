import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { Button } from '@/components/ui/button';
import { easeOutQuad } from '@/utils/easings';

import type { Announcement } from '../types/announcement';
import { AnnouncementPagination } from './AnnouncementPagination';

interface AnnouncementContentProps {
  announcements: Announcement[];
  current: number;
  isDesktop: boolean;
  isTransitioning: boolean;
  onClose: () => void;
  onNext: () => void;
  onSlideChange: (index: number) => void;
  isModalOpen: boolean;
  onPauseChange?: (isPaused: boolean) => void;
}

export function AnnouncementContent({
  announcements,
  current,
  isDesktop,
  isTransitioning,
  onClose,
  onNext,
  onSlideChange,
  isModalOpen,
  onPauseChange,
}: AnnouncementContentProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const currentAnnouncement = announcements[current];
  const touchStartX = useRef<number | null>(null);
  const touchHoldTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  if (!currentAnnouncement) return null;

  const updatePauseState = (newPauseState: boolean) => {
    setIsPaused(newPauseState);
    onPauseChange?.(newPauseState);
  };

  const handleMouseEnter = () => {
    if (isDesktop) {
      updatePauseState(true);
    }
  };

  const handleMouseLeave = () => {
    if (isDesktop) {
      updatePauseState(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;

    if (!isDesktop) {
      touchHoldTimeoutRef.current = setTimeout(() => {
        updatePauseState(true);
      }, 500);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchHoldTimeoutRef.current) {
      clearTimeout(touchHoldTimeoutRef.current);
      touchHoldTimeoutRef.current = null;
    }

    if (!isDesktop && isPaused) {
      updatePauseState(false);
    }

    if (isDesktop || touchStartX.current === null) return;
    const touchEndX = e.changedTouches?.[0]?.clientX;
    if (typeof touchEndX === 'number') {
      const diffX = touchEndX - touchStartX.current;
      const SWIPE_THRESHOLD = 50;
      if (diffX < -SWIPE_THRESHOLD && current < announcements.length - 1) {
        onSlideChange(current + 1);
      } else if (diffX > SWIPE_THRESHOLD && current > 0) {
        onSlideChange(current - 1);
      }
    }
    touchStartX.current = null;
  };

  const handleTouchMove = () => {
    if (touchHoldTimeoutRef.current) {
      clearTimeout(touchHoldTimeoutRef.current);
      touchHoldTimeoutRef.current = null;
    }
  };

  return (
    <div className="flex w-full flex-col justify-between md:w-[55.1%]">
      <AnimateChangeInHeight>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            ref={contentRef}
            key={currentAnnouncement.id}
            initial={
              isDesktop
                ? { opacity: 0, y: 20, filter: 'blur(8px)' }
                : { opacity: 0, scale: 0.9, filter: 'blur(8px)' }
            }
            animate={
              isDesktop
                ? {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: {
                      delay: isTransitioning ? 0.25 : 0,
                      duration: 0.3,
                      ease: easeOutQuad,
                    },
                  }
                : {
                    opacity: 1,
                    scale: 1,
                    filter: 'blur(0px)',
                    transition: {
                      delay: isTransitioning ? 0.25 : 0,
                      duration: 0.3,
                      ease: easeOutQuad,
                    },
                  }
            }
            exit={
              isDesktop
                ? {
                    opacity: 0.3,
                    y: -20,
                    filter: 'blur(8px)',
                    transition: { duration: 0.15, ease: easeOutQuad },
                  }
                : {
                    opacity: 0.3,
                    scale: 0.9,
                    filter: 'blur(8px)',
                    transition: { duration: 0.15, ease: easeOutQuad },
                  }
            }
            className="flex w-full flex-col items-center justify-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            <currentAnnouncement.Content />
          </motion.div>
        </AnimatePresence>
      </AnimateChangeInHeight>

      {/* CTA Button */}
      <div className="mt-4 flex flex-col justify-end gap-2 px-4 pb-4 sm:mt-8 sm:pb-2">
        {(() => {
          const { cta } = currentAnnouncement;
          const isLast = current === announcements.length - 1;

          const handleClick = () => {
            if (cta.onClick) cta.onClick();
            if (!cta.link && !cta.onClick) {
              if (isLast) {
                onClose();
              } else {
                onNext();
              }
            }
          };

          const button = (
            <Button
              className="w-full rounded-lg font-semibold"
              variant="default"
              onClick={handleClick}
            >
              {cta.label}
            </Button>
          );

          if (cta.link) {
            return (
              <Link href={cta.link} passHref legacyBehavior>
                <a
                  style={{ width: '100%' }}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={
                    cta.onClick
                      ? (e) => {
                          cta.onClick?.();
                          if (!cta.link && !cta.onClick) {
                            e.preventDefault();
                            handleClick();
                          }
                        }
                      : undefined
                  }
                >
                  {button}
                </a>
              </Link>
            );
          }

          return button;
        })()}

        <AnnouncementPagination
          totalCount={announcements.length}
          current={current}
          onNavigate={onSlideChange}
          isActive={isModalOpen}
          isPaused={isPaused}
        />
      </div>
    </div>
  );
}
