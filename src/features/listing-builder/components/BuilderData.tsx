'use client';

import { createContext, type ReactNode, useContext } from 'react';

import type { BuilderHackathon, BuilderTemplate } from '../types/builder';

interface BuilderData {
  // Hackathons a track can belong to.
  readonly hackathons: BuilderHackathon[];
  // Fewer than five of the sponsor's listings wait for winners.
  readonly createAllowed: boolean;
  // The template picker's bounty templates.
  readonly templates: BuilderTemplate[];
}

const BuilderDataContext = createContext<BuilderData>({
  hackathons: [],
  createAllowed: true,
  templates: [],
});

// What the builder's page loaded on the server, for its form's components.
export function BuilderDataProvider({
  value,
  children,
}: {
  value: BuilderData;
  children: ReactNode;
}) {
  return <BuilderDataContext value={value}>{children}</BuilderDataContext>;
}

export const useBuilderData = () => useContext(BuilderDataContext);
