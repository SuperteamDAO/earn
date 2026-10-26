'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { SponsorGrantDetailsResponse } from '../../constants/sponsorGrantDetails';
import type { GrantTrancheWithApplication } from '../../queries/tranches';
import type { GrantApplicationWithUser } from '../../types';

type Setter<T> = Dispatch<SetStateAction<T>>;

interface GrantReview {
  readonly slug: string;
  readonly grant: SponsorGrantDetailsResponse;
  // The grant's applications and tranches, as the page loaded them, with
  // the sponsor's decisions applied as they make them.
  readonly applications: GrantApplicationWithUser[];
  readonly setApplications: Setter<GrantApplicationWithUser[]>;
  readonly selectedApplication: GrantApplicationWithUser | undefined;
  readonly setSelectedApplication: Setter<GrantApplicationWithUser | undefined>;
  readonly tranches: GrantTrancheWithApplication[];
  readonly setTranches: Setter<GrantTrancheWithApplication[]>;
  readonly selectedTranche: GrantTrancheWithApplication | undefined;
  readonly setSelectedTranche: Setter<GrantTrancheWithApplication | undefined>;
  // While notes or labels save, the selection stays put.
  readonly setStateUpdating: (updating: boolean) => void;
  // Loads the page's data again from the server.
  readonly refresh: () => void;
}

const GrantReviewContext = createContext<GrantReview | null>(null);

// The grant review page's state: what Earn kept in react-query's cache and
// jotai atoms, now seeded from the server and refreshed after each write.
export function GrantReviewProvider({
  slug,
  grant,
  applications: loadedApplications,
  tranches: loadedTranches,
  children,
}: {
  slug: string;
  grant: SponsorGrantDetailsResponse;
  applications: GrantApplicationWithUser[];
  tranches: GrantTrancheWithApplication[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(loadedApplications);
  const [tranches, setTranches] = useState(loadedTranches);
  const [selectedApplication, setSelectedApplicationState] = useState<
    GrantApplicationWithUser | undefined
  >(undefined);
  const [selectedTranche, setSelectedTrancheState] = useState<
    GrantTrancheWithApplication | undefined
  >(undefined);
  const updating = useRef(false);

  // Fresh data from the server (after router.refresh()) replaces the local
  // copy, as it arrives.
  const [shownApplications, setShownApplications] =
    useState(loadedApplications);
  if (shownApplications !== loadedApplications) {
    setShownApplications(loadedApplications);
    setApplications(loadedApplications);
    setSelectedApplicationState((selected) =>
      selected
        ? (loadedApplications.find((row) => row.id === selected.id) ?? selected)
        : selected,
    );
  }
  const [shownTranches, setShownTranches] = useState(loadedTranches);
  if (shownTranches !== loadedTranches) {
    setShownTranches(loadedTranches);
    setTranches(loadedTranches);
    setSelectedTrancheState((selected) =>
      selected
        ? (loadedTranches.find((row) => row.id === selected.id) ?? selected)
        : selected,
    );
  }

  const setSelectedApplication = useCallback<
    Setter<GrantApplicationWithUser | undefined>
  >((update) => {
    if (!updating.current) setSelectedApplicationState(update);
  }, []);
  const setSelectedTranche = useCallback<
    Setter<GrantTrancheWithApplication | undefined>
  >((update) => {
    if (!updating.current) setSelectedTrancheState(update);
  }, []);
  const setStateUpdating = useCallback((value: boolean) => {
    updating.current = value;
  }, []);
  const refresh = useCallback(() => router.refresh(), [router]);

  const value = useMemo(
    () => ({
      slug,
      grant,
      applications,
      setApplications,
      selectedApplication,
      setSelectedApplication,
      tranches,
      setTranches,
      selectedTranche,
      setSelectedTranche,
      setStateUpdating,
      refresh,
    }),
    [
      slug,
      grant,
      applications,
      selectedApplication,
      setSelectedApplication,
      tranches,
      selectedTranche,
      setSelectedTranche,
      setStateUpdating,
      refresh,
    ],
  );

  return <GrantReviewContext value={value}>{children}</GrantReviewContext>;
}

export function useGrantReview(): GrantReview {
  const review = useContext(GrantReviewContext);
  if (!review) throw new Error('useGrantReview outside GrantReviewProvider');
  return review;
}
