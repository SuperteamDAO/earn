import { useEffect, useMemo, useState } from 'react';
import Countdown, { type CountdownProps } from 'react-countdown';

import { CountDownRenderer } from './countdownRenderer';

/**
 * SecureCountdown component that uses server time instead of client time
 * to ensure accurate countdown regardless of user's system time settings
 */
export function SecureCountdown(props: CountdownProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  // Convert props.date to a number timestamp using useMemo instead of useState
  const adjustedDate = useMemo(() => {
    if (props.date instanceof Date) {
      return props.date.getTime();
    } else if (typeof props.date === 'number') {
      return props.date;
    } else if (typeof props.date === 'string') {
      return new Date(props.date).getTime();
    }
    return Date.now(); // Fallback
  }, [props.date]);

  // Fetch server time and calculate offset
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        setIsLoading(true);
        const start = Date.now(); // Client request time

        const response = await fetch('/api/server-time');
        if (!response.ok) {
          throw new Error('Failed to fetch server time');
        }

        const data = await response.json();
        const end = Date.now(); // Client response time

        // Parse server time
        const serverTime = new Date(data.serverTime).getTime();

        // Calculate network latency (round trip / 2)
        const latency = Math.floor((end - start) / 2);

        // Adjusted server time accounting for network latency
        const adjustedServerTime = serverTime + latency;

        // Calculate offset between server time and client time
        const offset = adjustedServerTime - Date.now();
        setServerTimeOffset(offset);
      } catch (err) {
        console.error('Error fetching server time:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchServerTime();
  }, []);

  const getNow = () => {
    return Date.now() + serverTimeOffset;
  };

  // Custom renderer to handle loading state
  const wrappedRenderer = (countdownProps: any) => {
    if (isLoading) {
      // Use Date.now() for loading state
      return <CountDownRenderer {...countdownProps} />;
    }

    if (error) {
      // Use system time as fallback for error cases
      console.warn(
        'Using client time as fallback due to server time fetch error',
      );
    }

    // Use the original renderer
    return <CountDownRenderer {...countdownProps} />;
  };

  return (
    <Countdown
      {...props}
      date={adjustedDate}
      now={getNow}
      renderer={wrappedRenderer}
    />
  );
}
