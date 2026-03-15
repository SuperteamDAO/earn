interface ProgressSnapshot {
  progress: number;
  visible: boolean;
}

const IDLE_SNAPSHOT: ProgressSnapshot = Object.freeze({
  progress: 0,
  visible: false,
});

const subscribers = new Set<() => void>();

let snapshot: ProgressSnapshot = IDLE_SNAPSHOT;
let incrementTimer: ReturnType<typeof setInterval> | null = null;
let finishTimer: ReturnType<typeof setTimeout> | null = null;

function emitChange() {
  for (const subscriber of subscribers) {
    subscriber();
  }
}

function setSnapshot(nextSnapshot: ProgressSnapshot) {
  snapshot = nextSnapshot;
  emitChange();
}

function clearIncrementTimer() {
  if (!incrementTimer) {
    return;
  }

  clearInterval(incrementTimer);
  incrementTimer = null;
}

function advanceProgress(current: number) {
  if (current < 30) return current + 12;
  if (current < 60) return current + 7;
  if (current < 85) return current + 3;
  if (current < 94) return current + 1;
  return current;
}

function scheduleIncrement() {
  clearIncrementTimer();
  incrementTimer = setInterval(() => {
    if (!snapshot.visible) {
      clearIncrementTimer();
      return;
    }

    const nextProgress = advanceProgress(snapshot.progress);
    if (nextProgress === snapshot.progress) {
      clearIncrementTimer();
      return;
    }

    setSnapshot({
      visible: true,
      progress: nextProgress,
    });
  }, 200);
}

export function startTopLoader() {
  if (finishTimer) {
    clearTimeout(finishTimer);
    finishTimer = null;
  }

  if (!snapshot.visible) {
    setSnapshot({
      visible: true,
      progress: 8,
    });
  } else if (snapshot.progress < 8) {
    setSnapshot({
      visible: true,
      progress: 8,
    });
  }

  scheduleIncrement();
}

export function finishTopLoader() {
  clearIncrementTimer();

  if (!snapshot.visible) {
    return;
  }

  setSnapshot({
    visible: true,
    progress: 100,
  });

  finishTimer = setTimeout(() => {
    finishTimer = null;
    setSnapshot(IDLE_SNAPSHOT);
  }, 220);
}

export function subscribeTopLoader(onStoreChange: () => void) {
  subscribers.add(onStoreChange);

  return () => {
    subscribers.delete(onStoreChange);
  };
}

export function getTopLoaderSnapshot() {
  return snapshot;
}
