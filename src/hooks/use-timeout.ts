import { useCallback, useEffect, useRef } from 'react';

/**
 * Interface for timeout control methods
 */
export interface TimeoutHandle {
  /** Starts or restarts the timeout with initial delay */
  start: () => void;
  /** Pauses the timeout, preserving remaining time, does not run if timeout is already completed */
  pause: () => void;
  /** Resumes the timeout from where it was paused, does not run if timeout is already completed */
  resume: () => void;
  /** Resets and restarts the timeout with initial delay */
  restart: () => void;
  /** Checks if timeout is currently running */
  isActive: () => boolean;
  /** Checks if timeout is in paused state */
  isPaused: () => boolean;
  /** Clears the timeout */
  clear: () => void;
}

/**
 * Custom hook for creating a controllable timeout
 * @param callback Function to execute when timeout completes
 * @param delay Initial delay in milliseconds
 * @returns TimeoutHandle with control methods
 * @example
 * Note: the timeout does not start automatically, only starts when called .start() method
 * const timeout = useTimeout(() => console.log('Done!'), 5000);
 * timeout.start(); // Manually start the timeout
 * timeout.pause(); // Pause the countdown
 * timeout.resume(); // Resume from paused state
 */
export function useTimeout(callback: () => void, delay: number): TimeoutHandle {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const remainingRef = useRef(delay);
  const startTimeRef = useRef<number>(0);
  const isPausedRef = useRef(false);
  const isCompletedRef = useRef(false);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    startTimeRef.current = Date.now();
    isCompletedRef.current = false;
    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
      isCompletedRef.current = true;
      timeoutRef.current = null;
    }, remainingRef.current);
    isPausedRef.current = false;
  }, [clear]);

  const pause = useCallback(() => {
    if (timeoutRef.current && !isPausedRef.current && !isCompletedRef.current) {
      clear();
      remainingRef.current -= Date.now() - startTimeRef.current;
      isPausedRef.current = true;
    }
  }, [clear]);

  const resume = useCallback(() => {
    if (isPausedRef.current && !isCompletedRef.current) {
      start();
    }
  }, [start]);

  const restart = useCallback(() => {
    remainingRef.current = delay;
    start();
  }, [delay, start]);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return clear;
  }, [clear]);

  return {
    start,
    pause,
    resume,
    restart,
    clear,
    isActive: () => timeoutRef.current !== null,
    isPaused: () => isPausedRef.current,
  };
}
