import { useCallback, useEffect, useRef, useState } from 'react';

interface AnnouncementPaginationProps {
  totalCount: number;
  current: number;
  onNavigate: (index: number) => void;
  isActive: boolean;
  isPaused?: boolean;
}

export function AnnouncementPagination({
  totalCount,
  current,
  onNavigate,
  isActive,
  isPaused = false,
}: AnnouncementPaginationProps) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(0);

  const AUTO_ADVANCE_DURATION = 8000;
  const PROGRESS_UPDATE_INTERVAL = 16;

  const startProgress = useCallback(
    (remainingTime?: number) => {
      if (!isActive || isPaused) return;

      const duration = remainingTime || AUTO_ADVANCE_DURATION;
      remainingTimeRef.current = duration;
      startTimeRef.current = Date.now();

      const initialProgress = remainingTime
        ? ((AUTO_ADVANCE_DURATION - remainingTime) / AUTO_ADVANCE_DURATION) *
          100
        : 0;
      setProgress(initialProgress);

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const progressPercent = Math.min(
          (elapsed / duration) * 100 + initialProgress,
          100,
        );

        setProgress(progressPercent);

        if (progressPercent >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          if (current < totalCount - 1) {
            onNavigate(current + 1);
          } else {
            onNavigate(0);
          }
        }
      }, PROGRESS_UPDATE_INTERVAL);
    },
    [current, totalCount, onNavigate, isActive, isPaused],
  );

  const stopProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pauseProgress = useCallback(() => {
    if (intervalRef.current && !isPaused) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(
        remainingTimeRef.current - elapsed,
        0,
      );
      stopProgress();
    }
  }, [stopProgress, isPaused]);

  const resumeProgress = useCallback(() => {
    if (isPaused || remainingTimeRef.current <= 0) return;
    startProgress(remainingTimeRef.current);
  }, [startProgress, isPaused]);

  useEffect(() => {
    if (isPaused) {
      pauseProgress();
    } else if (intervalRef.current === null && remainingTimeRef.current > 0) {
      resumeProgress();
    }
  }, [isPaused, pauseProgress, resumeProgress]);

  useEffect(() => {
    stopProgress();
    remainingTimeRef.current = AUTO_ADVANCE_DURATION;
    if (isActive && !isPaused) {
      startProgress();
    }

    return stopProgress;
  }, [current, isActive, startProgress, stopProgress]);

  const handleIndicatorClick = (index: number) => {
    if (index !== current) {
      stopProgress();
      remainingTimeRef.current = AUTO_ADVANCE_DURATION;
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
