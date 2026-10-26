'use client';

import {
  useLoginWithEmail,
  useLoginWithOAuth,
  usePrivy,
} from '@privy-io/react-auth';
import { ArrowLeft } from 'lucide-react';
import { posthog } from 'posthog-js';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import MdOutlineEmail from '@/components/icons/MdOutlineEmail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { TERMS_OF_USE } from '@/constants/TERMS_OF_USE';
import {
  SIGN_IN_GOOGLE,
  SIGN_IN_HEIGHT,
  SIGNED_IN,
} from '@/lib/auth/sign-in-messages';
import { validateEmailRegex } from '@/lib/email';
import { GoogleIcon } from '@/svg/google';

// If the server rejects a session the SDK thinks is valid, sign-in would
// bounce forever, so allow one automatic hop per window. Without storage
// there's no counting hops, so none are allowed.
const HOP_KEY = 'earn:login-hop';
const HOP_WINDOW_MS = 10_000;

// Pages a brand-new account may land on before it has a profile; anywhere
// else, it finishes one first.
const ONBOARDING_FREE = ['/earn/new', '/earn/sponsor', '/earn/signup'];

function hopAllowed(): boolean {
  try {
    const last = Number(sessionStorage.getItem(HOP_KEY));
    if (Date.now() - last < HOP_WINDOW_MS) return false;
    sessionStorage.setItem(HOP_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

// Where a new account goes after its first sign-in.
function landing(next: string, created: boolean): string {
  if (!created || ONBOARDING_FREE.some((path) => next.startsWith(path))) {
    return next;
  }
  return `/earn/new/?type=forced&originUrl=${encodeURIComponent(next)}`;
}

// Issues Earn's own session from Privy's fresh token, and on a first
// sign-in makes the Earn account. null when the server refused.
async function beginSession(): Promise<{
  readonly created: boolean;
  readonly refusal: string | null;
} | null> {
  const response = await fetch('/earn/session/', { method: 'POST' }).catch(
    () => null,
  );
  // Not arriving at all: Privy's token still carries the next page.
  if (!response) return { created: false, refusal: null };
  if (!response.ok) {
    console.error(`Session refused: ${response.status}`);
    return null;
  }
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== 'object' || body === null) {
    return { created: false, refusal: null };
  }
  return {
    created: 'created' in body && body.created === true,
    refusal:
      'refusal' in body && typeof body.refusal === 'string'
        ? body.refusal
        : null,
  };
}

const REFUSALS: Record<string, string> = {
  email:
    'Your email already has an Earn account that signs in another way. Sign in with that one.',
  'rate-limited': 'Too many new accounts from here. Try again in a while.',
  database: 'We couldn’t set up your account. Try again in a minute.',
};

// Tells the dialog that frames this page how tall the card is.
function useReportHeight(embed: boolean) {
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = card.current;
    if (!embed || !element || window.parent === window) return undefined;
    const report = () =>
      window.parent.postMessage(
        { type: SIGN_IN_HEIGHT, height: element.offsetHeight },
        window.location.origin,
      );
    const observer = new ResizeObserver(report);
    observer.observe(element);
    report();
    return () => observer.disconnect();
  }, [embed]);
  return card;
}

// Earn's sign-in card: the content of the dialog Earn shows over every page
// (src/lib/auth/sign-in-dialog.tsx frames it, `embed`), or on its own when
// sign-in is opened directly.
export function LoginCard({
  embed = false,
  children,
}: {
  embed?: boolean;
  children: React.ReactNode;
}) {
  const card = useReportHeight(embed);
  return (
    <div
      ref={card}
      className={
        embed
          ? 'w-full overflow-hidden bg-white pt-2'
          : 'w-full max-w-[23rem] overflow-hidden rounded-lg border border-slate-200 bg-white pt-2 shadow-lg'
      }
    >
      {children}
      <div className="rounded-b-md bg-slate-100 py-[7px]">
        <p className="text-center text-xs text-slate-400">
          Need help? Reach out to us at{' '}
          <a
            href="mailto:support@superteam.fun"
            className="underline hover:text-slate-500"
          >
            support@superteam.fun
          </a>
        </p>
      </div>
    </div>
  );
}

// Pages that embed the form under their own heading (Earn's inline sign-in
// on the invite and new-sponsor pages) leave this one out.
const HeadingContext = createContext(true);

export function HeadingProvider({
  heading,
  children,
}: {
  heading: boolean;
  children: React.ReactNode;
}) {
  return <HeadingContext value={heading}>{children}</HeadingContext>;
}

function Header({ onBack }: { onBack?: () => void }) {
  const heading = useContext(HeadingContext);
  if (!heading) {
    return onBack ? (
      <div className="px-6 pt-2 pb-4">
        <button
          type="button"
          aria-label="Back"
          className="text-slate-500"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
    ) : null;
  }
  return (
    <div className="relative py-5">
      {onBack && (
        <button
          type="button"
          aria-label="Back"
          className="absolute top-6 left-5 text-slate-500"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <h1 className="text-center text-lg font-semibold text-slate-900">
        You&apos;re one step away
      </h1>
      <p className="text-center text-sm text-slate-600">
        From earning in global standards
      </p>
    </div>
  );
}

function Terms() {
  return (
    <p className="mt-4 mb-2 text-center text-xs text-slate-500">
      By using this website, you agree to our{' '}
      <a
        href={TERMS_OF_USE}
        className="font-semibold hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Terms of Use
      </a>{' '}
      and our{' '}
      <a
        href="https://superteam.fun/earn/privacy-policy.pdf"
        className="font-semibold hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Privacy Policy
      </a>
      .
    </p>
  );
}

// While Privy starts, or finishes signing them in.
export function Waiting({ label = 'Loading…' }: { label?: string }) {
  return (
    <>
      <Header />
      <div className="px-6 pb-6" role="status" aria-live="polite">
        <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
        <p className="mt-3 text-center text-sm text-slate-500">{label}</p>
      </div>
    </>
  );
}

export function LoginForm({
  next,
  expectingSession,
  embed = false,
  google = false,
}: {
  next: string;
  expectingSession: boolean;
  // Framed by Earn's sign-in dialog: hand Google and the finish to the page.
  embed?: boolean;
  // Sent here by the dialog to sign in with Google: start it at once.
  google?: boolean;
}) {
  const { ready, authenticated, getAccessToken, logout } = usePrivy();
  const [error, setError] = useState<string | null>(null);
  const [stuck, setStuck] = useState<string | null>(null);
  const [step, setStep] = useState<'choose' | 'email' | 'code'>('choose');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const acted = useRef(false);

  const emailLogin = useLoginWithEmail();
  const googleLogin = useLoginWithOAuth({
    onError: () => setError('Google sign-in didn’t finish.'),
  });

  // Finishes every sign-in: email code, Google redirect or restored session.
  useEffect(() => {
    if (!ready || !authenticated) return;
    const automatic =
      !acted.current &&
      !new URLSearchParams(window.location.search).has('privy_oauth_code');
    if (automatic && !hopAllowed()) {
      setStuck('Your session couldn’t be confirmed. Sign out and try again.');
      return;
    }
    // Leave only once a fresh token is in the cookie and Earn's own session
    // has been issued from it, or the next page would send them back here.
    void getAccessToken()
      .catch(() => null)
      .then((token) => (token ? beginSession() : null))
      .then((session) => {
        if (!session) {
          setStuck(
            'Your session couldn’t be confirmed. Sign out and try again.',
          );
        } else if (session.refusal) {
          setStuck(
            REFUSALS[session.refusal] ?? 'Something went wrong. Try again.',
          );
        } else if (embed && window.parent !== window) {
          window.parent.postMessage(
            { type: SIGNED_IN, href: landing(next, session.created) },
            window.location.origin,
          );
        } else {
          window.location.replace(landing(next, session.created));
        }
      });
  }, [ready, authenticated, getAccessToken, next, embed]);

  const startGoogle = () => {
    posthog.capture('google_auth');
    setError(null);
    // Google refuses to sign in inside a frame; the page goes to sign-in
    // for it, which starts Google there.
    if (embed && window.parent !== window) {
      window.parent.postMessage(
        { type: SIGN_IN_GOOGLE },
        window.location.origin,
      );
      return;
    }
    acted.current = true;
    googleLogin.initOAuth({ provider: 'google' }).catch(() => {
      setError('Google sign-in didn’t start. Try again.');
    });
  };

  // While true, Google is starting (it leaves the page when it does).
  const [autoGoogle, setAutoGoogle] = useState(google);
  const googleStarted = useRef(false);
  useEffect(() => {
    if (!ready || authenticated || !google || googleStarted.current) return;
    googleStarted.current = true;
    acted.current = true;
    googleLogin.initOAuth({ provider: 'google' }).catch(() => {
      setAutoGoogle(false);
      setError('Google sign-in didn’t start. Try again.');
    });
  }, [ready, authenticated, google, googleLogin]);

  if (stuck) {
    return (
      <>
        <Header />
        <div className="px-6 pb-6">
          <p className="text-center text-sm text-slate-600" role="alert">
            {stuck}
          </p>
          <Button
            type="button"
            className="mt-4 h-12 w-full"
            onClick={() =>
              void fetch('/earn/sign-out/', { method: 'POST' })
                .catch(() => null)
                .then(() => logout())
                .then(() => window.location.reload())
            }
          >
            Sign out
          </Button>
        </div>
      </>
    );
  }

  // Privy will likely sign them in unprompted, so say so rather than show
  // the form for a moment.
  if (!ready || authenticated || autoGoogle) {
    return (
      <Waiting
        label={
          authenticated || expectingSession || google
            ? 'Signing you in…'
            : 'Loading…'
        }
      />
    );
  }

  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    setError(null);
    if (!validateEmailRegex(address)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSending(true);
    try {
      const check = await fetch('/api/email/validate/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: address }),
      });
      const verdict: unknown = check.ok ? await check.json() : null;
      const deliverable =
        typeof verdict === 'object' &&
        verdict !== null &&
        'isValid' in verdict &&
        verdict.isValid === true;
      if (!deliverable) {
        setError(
          check.status === 429
            ? 'Too many attempts. Try again in a minute.'
            : 'This email address appears to be invalid or needs to be whitelisted. Please check and try again.',
        );
        return;
      }
      posthog.capture('email OTP_auth');
      await emailLogin.sendCode({ email: address });
      setEmail(address);
      setStep('code');
    } catch (cause) {
      console.error(cause);
      setError('Couldn’t send a code. Try again.');
    } finally {
      setSending(false);
    }
  };

  const submitCode = (code: string) => {
    setError(null);
    acted.current = true;
    emailLogin.loginWithCode({ code }).catch(() => {
      setError('Invalid code. Please try again.');
    });
  };

  if (step === 'code') {
    return (
      <>
        <Header onBack={() => setStep('email')} />
        <div className="mb-20 flex flex-col items-center gap-4 px-6">
          <h2 className="text-center text-lg font-medium text-slate-500">
            Enter OTP
          </h2>
          <InputOTP
            maxLength={6}
            onComplete={submitCode}
            autoFocus
            inputMode="numeric"
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="border-gray-400"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="text-center text-xs text-slate-400">
            We just sent an OTP on your email <b>{email}</b>
          </p>
          {error && (
            <p
              className="text-center text-xs leading-[0.9rem] text-red-500"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Header onBack={step === 'email' ? () => setStep('choose') : undefined} />
      <div className="px-6">
        {step === 'choose' ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-500">
            <Button
              className="ph-no-capture h-12 w-full font-medium"
              size="lg"
              disabled={googleLogin.state.status === 'loading'}
              onClick={startGoogle}
            >
              <GoogleIcon />
              <span>
                {googleLogin.state.status === 'loading'
                  ? 'Connecting...'
                  : 'Continue with Google'}
              </span>
            </Button>
            <div className="my-3 flex w-full items-center gap-4">
              <div className="h-px flex-1 bg-slate-300" />
              <span className="text-sm text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-300" />
            </div>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full bg-white font-medium text-slate-500 hover:bg-slate-100 active:bg-slate-200"
              onClick={() => setStep('email')}
            >
              <MdOutlineEmail className="mr-2" />
              <span>Continue with Email</span>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendCode();
            }}
          >
            <Input
              className="h-12 border-slate-300 text-lg"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="Enter Your Email Address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
            />
            <Button
              type="submit"
              className="ph-no-capture mt-3 h-12 w-full font-medium"
              disabled={sending}
            >
              {sending ? 'Loading...' : 'Continue with Email'}
            </Button>
          </form>
        )}
        {error && (
          <p
            className="mt-2 text-center text-xs leading-[0.9rem] text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
        <Terms />
      </div>
    </>
  );
}
