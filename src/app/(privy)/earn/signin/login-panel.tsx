'use client';

import { PrivyAuthProvider, type PrivyProps } from '../../privy-auth-provider';
import { useTurn } from '../../turn';
import { HeadingProvider, LoginCard, LoginForm, Waiting } from './login-form';

// Sign-in's card. Privy starts only on its turn (see turn.ts); until then
// the card shows as it does while Privy loads.
export function LoginPanel({
  privy,
  next,
  expectingSession,
  embed,
  google,
  heading,
}: {
  privy: PrivyProps;
  next: string;
  expectingSession: boolean;
  embed: boolean;
  google: boolean;
  heading: boolean;
}) {
  const { started, ready } = useTurn();
  return (
    <HeadingProvider heading={heading}>
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
    </HeadingProvider>
  );
}
