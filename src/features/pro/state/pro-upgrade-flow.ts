import { atom, useAtomValue, useSetAtom } from 'jotai';

export type ProUpgradeFlowSource = 'dialog' | 'sidebar' | 'banner';

export type ProUpgradeFlowStatus = 'idle' | 'loading' | 'expanding' | 'full';

export interface ProUpgradeOriginRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface ProUpgradeViewport {
  readonly width: number;
  readonly height: number;
}

interface ProUpgradeFlowState {
  readonly status: ProUpgradeFlowStatus;
  readonly source: ProUpgradeFlowSource | null;
  readonly originRect: ProUpgradeOriginRect | null;
  readonly viewport: ProUpgradeViewport | null;
}

const initialFlowState: ProUpgradeFlowState = {
  status: 'idle',
  source: null,
  originRect: null,
  viewport: null,
};

const proUpgradeFlowAtom = atom<ProUpgradeFlowState>(initialFlowState);

interface StartFlowPayload {
  readonly source: ProUpgradeFlowSource;
  readonly originRect: ProUpgradeOriginRect;
  readonly viewport: ProUpgradeViewport;
}

const startProUpgradeFlowAtom = atom(
  null,
  (_get, set, payload: StartFlowPayload) => {
    set(proUpgradeFlowAtom, {
      status: 'loading',
      source: payload.source,
      originRect: payload.originRect,
      viewport: payload.viewport,
    });
  },
);

const triggerProUpgradeExpansionAtom = atom(null, (get, set) => {
  const current = get(proUpgradeFlowAtom);

  if (current.status === 'idle') {
    return;
  }

  set(proUpgradeFlowAtom, {
    ...current,
    status: 'expanding',
  });
});

const markProUpgradeFullAtom = atom(null, (get, set) => {
  const current = get(proUpgradeFlowAtom);

  if (current.status === 'idle') {
    return;
  }

  set(proUpgradeFlowAtom, {
    ...current,
    status: 'full',
  });
});

const resetProUpgradeFlowAtom = atom(null, (_get, set) => {
  set(proUpgradeFlowAtom, initialFlowState);
});

export const useProUpgradeFlow = () => {
  const flow = useAtomValue(proUpgradeFlowAtom);
  const start = useSetAtom(startProUpgradeFlowAtom);
  const triggerExpansion = useSetAtom(triggerProUpgradeExpansionAtom);
  const markFull = useSetAtom(markProUpgradeFullAtom);
  const reset = useSetAtom(resetProUpgradeFlowAtom);

  return {
    flow,
    start,
    triggerExpansion,
    markFull,
    reset,
  };
};
