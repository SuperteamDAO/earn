'use client';

import { PrivyAuthProvider, type PrivyProps } from '../../privy-auth-provider';
import { useTurn } from '../../turn';
import { LoginCard, LoginForm, Waiting } from './login-form';

// Sign-in's card. Privy starts only on its turn (see turn.ts); until then
// the card shows as it does while Privy loads.
export function LoginPanel({
  privy,
  next,
  expectingSession,
  embed,
  google,
}: {
  privy: PrivyProps;
  next: string;
  expectingSession: boolean;
  embed: boolean;
  google: boolean;
}) {
  const { started, ready } = useTurn();
  return (
    <LoginCard embed={embed}>
      {started ? (
        <PrivyAuthProvider {...privy} onReady={ready}>
          <LoginForm
            next={next}
            expectingSession={expectingSession}
            embed={embed}
            google={google}
          />
        </PrivyAuthProvider>
      ) : (
        <Waiting />
      )}
    </LoginCard>
  );
}
