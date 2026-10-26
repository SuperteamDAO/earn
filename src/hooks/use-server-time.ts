'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

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

interface SyncState {
  readonly data: SyncData | null;
  readonly checkpoint: DriftCheckpoint | null;
  readonly error: string | null;
  readonly isSyncing: boolean;
}

// One sync per endpoint, shared by every component on the page.
interface Store {
  state: SyncState;
  readonly listeners: Set<() => void>;
  inflight: Promise<void> | null;
}

const stores = new Map<string, Store>();
const INITIAL: SyncState = {
  data: null,
  checkpoint: null,
  error: null,
  isSyncing: false,
};

const storeFor = (endpoint: string): Store => {
  let store = stores.get(endpoint);
  if (!store) {
    store = { state: INITIAL, listeners: new Set(), inflight: null };
    stores.set(endpoint, store);
  }
  return store;
};

const setState = (store: Store, next: Partial<SyncState>) => {
  store.state = { ...store.state, ...next };
  store.listeners.forEach((listener) => listener());
};

const fetchServerTime = async (endpoint: string): Promise<SyncData> => {
  const clientTimeBeforeRequest = Date.now();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-cache',
  });
  if (!response.ok) {
    throw new Error(
      `Server time request failed: ${response.status} ${response.statusText}`,
    );
  }
  const clientTimeAfterRequest = Date.now();
  const data: unknown = await response.json();
  if (
    typeof data !== 'object' ||
    data === null ||
    !('timestamp' in data) ||
    typeof data.timestamp !== 'number' ||
    isNaN(data.timestamp)
  ) {
    throw new Error('Invalid timestamp received from server');
  }
  const networkLatency = (clientTimeAfterRequest - clientTimeBeforeRequest) / 2;
  const adjustedServerTime = data.timestamp + networkLatency;
  return {
    offset: adjustedServerTime - clientTimeAfterRequest,
    serverTime: adjustedServerTime,
    networkLatency,
    syncedAt: new Date().toISOString(),
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetches the server's time, retrying with backoff; concurrent callers share
// one request.
const sync = (
  endpoint: string,
  maxRetries: number,
  retryDelay: number,
): Promise<void> => {
  const store = storeFor(endpoint);
  if (store.inflight) return store.inflight;
  setState(store, { isSyncing: true });
  store.inflight = (async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        const data = await fetchServerTime(endpoint);
        setState(store, {
          data,
          checkpoint: {
            performanceTime: performance.now(),
            dateTime: Date.now(),
          },
          error: null,
          isSyncing: false,
        });
        return;
      } catch (error) {
        if (attempt >= maxRetries) {
          setState(store, {
            error: error instanceof Error ? error.message : String(error),
            isSyncing: false,
          });
          return;
        }
        await sleep(retryDelay * Math.pow(2, attempt));
      }
    }
  })().finally(() => {
    store.inflight = null;
  });
  return store.inflight;
};

export const useServerTimeSync = (
  options: UseServerTimeSyncOptions = {},
): UseServerTimeSyncReturn => {
  const {
    syncInterval = 2.5 * 60 * 1000,
    autoSync = true,
    endpoint = '/api/server-time/',
    onError,
    onSync,
    maxRetries = 3,
    retryDelay = 1000,
    driftCheckInterval = 5 * 1000,
    driftThreshold = 2500,
    onDriftDetected,
  } = options;

  const store = storeFor(endpoint);
  const state = useSyncExternalStore(
    useCallback(
      (listener: () => void) => {
        store.listeners.add(listener);
        return () => store.listeners.delete(listener);
      },
      [store],
    ),
    () => store.state,
    () => INITIAL,
  );
  const [detectedDrift, setDetectedDrift] = useState<number | null>(null);

  const manualSync = useCallback(
    () => sync(endpoint, maxRetries, retryDelay),
    [endpoint, maxRetries, retryDelay],
  );

  // Synced on first use, again once stale and when back online.
  useEffect(() => {
    if (!autoSync) return undefined;
    const syncedAt = store.state.data?.syncedAt;
    if (!syncedAt || Date.now() - Date.parse(syncedAt) > syncInterval) {
      void manualSync();
    }
    const onOnline = () => void manualSync();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [autoSync, manualSync, store, syncInterval]);

  useEffect(() => {
    if (state.data) {
      setDetectedDrift(null);
      onSync?.(state.data);
    }
    // Only when a new sync lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data]);

  useEffect(() => {
    if (state.error) onError?.(new Error(state.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  const { checkpoint } = state;
  const isSync = state.data !== null;

  // The wall clock jumped (sleep, a changed clock): sync again.
  useEffect(() => {
    if (!checkpoint || !autoSync || !isSync) return undefined;
    const timer = setInterval(() => {
      const elapsed = performance.now() - checkpoint.performanceTime;
      const drift = Math.abs(Date.now() - (checkpoint.dateTime + elapsed));
      if (drift > driftThreshold) {
        setDetectedDrift(drift);
        onDriftDetected?.(drift);
        void manualSync();
      }
    }, driftCheckInterval);
    return () => clearInterval(timer);
  }, [
    checkpoint,
    autoSync,
    isSync,
    driftThreshold,
    driftCheckInterval,
    manualSync,
    onDriftDetected,
  ]);

  const offset = state.data?.offset ?? 0;
  const serverTime = useCallback((): number => {
    if (checkpoint && isSync) {
      const performanceElapsed = performance.now() - checkpoint.performanceTime;
      return checkpoint.dateTime + offset + performanceElapsed;
    }
    return Date.now() + offset;
  }, [offset, checkpoint, isSync]);

  return {
    serverTime,
    isSync,
    error: state.error,
    offset,
    manualSync,
    isSyncing: state.isSyncing,
    lastSyncData: state.data,
    detectedDrift,
  };
};
