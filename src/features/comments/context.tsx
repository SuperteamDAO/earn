'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface ValidUsernames {
  readonly validUsernames: ReadonlyArray<string>;
  readonly addValidUsernames: (usernames: ReadonlyArray<string>) => void;
}

const ValidUsernamesContext = createContext<ValidUsernames>({
  validUsernames: [],
  addValidUsernames: () => {},
});

// The @mentions in a comment thread that name real people, so only those
// render as profile links. Loaded with the comments; a mention picked from
// the suggestions joins them.
export function ValidUsernamesProvider({
  initial,
  children,
}: {
  initial: ReadonlyArray<string>;
  children: React.ReactNode;
}) {
  const [validUsernames, setValidUsernames] =
    useState<ReadonlyArray<string>>(initial);
  const addValidUsernames = useCallback(
    (usernames: ReadonlyArray<string>) =>
      setValidUsernames((current) =>
        Array.from(new Set([...current, ...usernames])),
      ),
    [],
  );
  return (
    <ValidUsernamesContext value={{ validUsernames, addValidUsernames }}>
      {children}
    </ValidUsernamesContext>
  );
}

export const useValidUsernames = () => useContext(ValidUsernamesContext);
