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

interface UseServerTimeSyncOptions {
  syncInterval?: number;
  autoSync?: boolean;
  endpoint?: string;
  onError?: (error: Error) => void;
  onSync?: (data: SyncData) => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseServerTimeSyncReturn {
  serverTime: () => number;
  isSync: boolean;
  error: string | null;
  offset: number;
  manualSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncData: SyncData | null;
}

const useServerTimeSync = (
  options: UseServerTimeSyncOptions = {},
): UseServerTimeSyncReturn => {
  const {
    syncInterval = 30 * 1000, // 30 seconds
    autoSync = true,
    endpoint = '/api/server-time',
    onError,
    onSync,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [serverOffset, setServerOffset] = useState<number>(0);
  const [lastSyncData, setLastSyncData] = useState<SyncData | null>(null);

  const onErrorRef = useRef(onError);
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

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
    retryDelay: (attemptIndex) => retryDelay * Math.pow(2, attemptIndex), // Exponential backoff
    staleTime: syncInterval / 2, // Consider data stale after half the sync interval
    gcTime: syncInterval * 2, // Keep in cache for 2x sync interval
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (data) {
      setServerOffset(data.offset);
      setLastSyncData(data);

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

  const serverTime = useCallback((): number => {
    return Date.now() + serverOffset;
  }, [serverOffset]);

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
  };
};

export default useServerTimeSync;
