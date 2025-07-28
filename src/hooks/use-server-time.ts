import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ServerTimeResponse {
  timestamp: number;
  iso?: string;
  timezone?: string;
}

interface SyncData {
  offset: number;
  serverTime: number;
  networkLatency: number;
  syncedAt: string;
}

interface DriftCheckpoint {
  performanceTime: number;
  dateTime: number;
}

interface UseServerTimeSyncOptions {
  syncInterval?: number;
  autoSync?: boolean;
  endpoint?: string;
  onError?: (error: Error) => void;
  onSync?: (data: SyncData) => void;
  maxRetries?: number;
  retryDelay?: number;
  driftCheckInterval?: number;
  driftThreshold?: number;
  onDriftDetected?: (driftAmount: number) => void;
}

interface UseServerTimeSyncReturn {
  serverTime: () => number;
  isSync: boolean;
  error: string | null;
  offset: number;
  manualSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncData: SyncData | null;
  detectedDrift: number | null;
}

const useServerTimeSync = (
  options: UseServerTimeSyncOptions = {},
): UseServerTimeSyncReturn => {
  const {
    syncInterval = 30 * 1000,
    autoSync = true,
    endpoint = '/api/server-time',
    onError,
    onSync,
    maxRetries = 3,
    retryDelay = 1000,
    driftCheckInterval = 5 * 1000,
    driftThreshold = 2500,
    onDriftDetected,
  } = options;

  const [serverOffset, setServerOffset] = useState<number>(0);
  const [lastSyncData, setLastSyncData] = useState<SyncData | null>(null);
  const [detectedDrift, setDetectedDrift] = useState<number | null>(null);
  const [driftCheckpoint, setDriftCheckpoint] =
    useState<DriftCheckpoint | null>(null);

  const onErrorRef = useRef(onError);
  const onSyncRef = useRef(onSync);
  const onDriftDetectedRef = useRef(onDriftDetected);
  const driftCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    onDriftDetectedRef.current = onDriftDetected;
  }, [onDriftDetected]);

  const fetchServerTime = useCallback(async (): Promise<SyncData> => {
    const clientTimeBeforeRequest = Date.now();

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(
        `Server time request failed: ${response.status} ${response.statusText}`,
      );
    }

    const clientTimeAfterRequest = Date.now();
    const data: ServerTimeResponse = await response.json();

    if (typeof data.timestamp !== 'number' || isNaN(data.timestamp)) {
      throw new Error('Invalid timestamp received from server');
    }

    const networkLatency =
      (clientTimeAfterRequest - clientTimeBeforeRequest) / 2;
    const adjustedServerTime = data.timestamp + networkLatency;
    const offset = adjustedServerTime - clientTimeAfterRequest;

    const syncData: SyncData = {
      offset,
      serverTime: adjustedServerTime,
      networkLatency,
      syncedAt: new Date().toISOString(),
    };

    return syncData;
  }, [endpoint]);

  const {
    data,
    error,
    isLoading: isSyncing,
    isSuccess: isSync,
    refetch,
  } = useQuery({
    queryKey: ['server-time', endpoint],
    queryFn: fetchServerTime,
    enabled: autoSync,
    refetchInterval: autoSync ? syncInterval : false,
    retry: maxRetries,
    retryDelay: (attemptIndex) => retryDelay * Math.pow(2, attemptIndex),
    staleTime: syncInterval / 2,
    gcTime: syncInterval * 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (data) {
      setServerOffset(data.offset);
      setLastSyncData(data);
      setDetectedDrift(null);

      setDriftCheckpoint({
        performanceTime: performance.now(),
        dateTime: Date.now(),
      });

      if (onSyncRef.current) {
        onSyncRef.current(data);
      }
    }
  }, [data]);

  useEffect(() => {
    if (error && onErrorRef.current) {
      onErrorRef.current(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }, [error]);

  const checkForDrift = useCallback(() => {
    if (!driftCheckpoint || !isSync) return;

    const currentPerformanceTime = performance.now();
    const currentDateTime = Date.now();

    const performanceElapsed =
      currentPerformanceTime - driftCheckpoint.performanceTime;
    const expectedDateTime = driftCheckpoint.dateTime + performanceElapsed;

    const drift = Math.abs(currentDateTime - expectedDateTime);

    if (drift > driftThreshold) {
      setDetectedDrift(drift);

      if (onDriftDetectedRef.current) {
        onDriftDetectedRef.current(drift);
      }

      refetch();
    }
  }, [driftCheckpoint, isSync, driftThreshold, refetch]);

  useEffect(() => {
    if (driftCheckIntervalRef.current) {
      clearInterval(driftCheckIntervalRef.current);
    }

    if (driftCheckpoint && autoSync && isSync) {
      driftCheckIntervalRef.current = setInterval(
        checkForDrift,
        driftCheckInterval,
      );
    }

    return () => {
      if (driftCheckIntervalRef.current) {
        clearInterval(driftCheckIntervalRef.current);
      }
    };
  }, [driftCheckpoint, autoSync, isSync, checkForDrift, driftCheckInterval]);

  const serverTime = useCallback((): number => {
    if (driftCheckpoint && isSync) {
      const performanceElapsed =
        performance.now() - driftCheckpoint.performanceTime;
      const originalServerTime = driftCheckpoint.dateTime + serverOffset;
      return originalServerTime + performanceElapsed;
    }

    return Date.now() + serverOffset;
  }, [serverOffset, driftCheckpoint, isSync]);

  const manualSync = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  return {
    serverTime,
    isSync,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    offset: serverOffset,
    manualSync,
    isSyncing,
    lastSyncData,
    detectedDrift,
  };
};

export default useServerTimeSync;
