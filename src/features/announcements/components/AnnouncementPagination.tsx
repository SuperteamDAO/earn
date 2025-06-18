import { useCallback, useEffect, useRef, useState } from 'react';

interface AnnouncementPaginationProps {
  totalCount: number;
  current: number;
  onNavigate: (index: number) => void;
  isActive: boolean; // Whether the modal is open and should auto-advance
}

export function AnnouncementPagination({
  totalCount,
  current,
  onNavigate,
  isActive,
}: AnnouncementPaginationProps) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const AUTO_ADVANCE_DURATION = 5000; // 5 seconds
  const PROGRESS_UPDATE_INTERVAL = 16; // ~60fps for smooth animation

  const startProgress = useCallback(() => {
    if (!isActive) return;

    startTimeRef.current = Date.now();
    setProgress(0);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progressPercent = Math.min(
        (elapsed / AUTO_ADVANCE_DURATION) * 100,
        100,
      );

      setProgress(progressPercent);

      if (progressPercent >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Auto-advance to next slide
        if (current < totalCount - 1) {
          onNavigate(current + 1);
        } else {
          // Reset to first slide when reaching the end
          onNavigate(0);
        }
      }
    }, PROGRESS_UPDATE_INTERVAL);
  }, [current, totalCount, onNavigate, isActive]);

  const stopProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start progress when component mounts or current changes
  useEffect(() => {
    stopProgress();
    if (isActive) {
      startProgress();
    }

    return stopProgress;
  }, [current, isActive, startProgress, stopProgress]);

  // Handle manual navigation
  const handleIndicatorClick = (index: number) => {
    if (index !== current) {
      stopProgress();
      onNavigate(index);
    }
  };

  if (totalCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-[0.2rem] py-1 sm:pt-0">
      {Array.from({ length: totalCount }, (_, index) => {
        const isCurrentActive = index === current;

        return (
          <button
            key={index}
            type="button"
            className={`relative overflow-hidden rounded-full bg-slate-200 transition-all duration-200 ease-out ${
              isCurrentActive
                ? 'h-[0.3125rem] w-[1.375rem]'
                : 'h-[0.3125rem] w-[0.5625rem] hover:w-[0.75rem]'
            }`}
            onClick={() => handleIndicatorClick(index)}
            aria-label={`Go to announcement ${index + 1}`}
          >
            {isCurrentActive && (
              <div
                className="absolute inset-0 rounded-full bg-stone-500 transition-transform duration-75 ease-linear"
                style={{
                  transform: `translateX(-${100 - progress}%)`,
                  transformOrigin: 'left center',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
