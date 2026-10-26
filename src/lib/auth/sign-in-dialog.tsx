'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { safeNext } from '@/lib/safe-next';

import { SIGN_IN_GOOGLE, SIGN_IN_HEIGHT, SIGNED_IN } from './sign-in-messages';

const SIGN_IN_PATH = '/earn/signin/';

const SignInContext = createContext<(next?: string) => void>(() => {});

// Opens Earn's sign-in dialog over the current page; signed in, they come
// back to `next` (this page by default).
export const useSignIn = () => useContext(SignInContext);

const here = () => window.location.pathname + window.location.search;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Earn's sign-in dialog, on every page. Privy's SDK may only load on the
// sign-in page (its own document, with its own CSP), so the dialog frames
// that page: the form, its code step and Privy all live in the frame, and
// this page loads none of it. Google can't sign in inside a frame, so the
// frame asks this page to go to sign-in for it, which redirects to Google
// as Earn always did.
//
// Any plain link to the sign-in page opens the dialog instead of leaving,
// so headers and prompts keep linking to `signInHref(next)`.
export function SignInDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [next, setNext] = useState<string | null>(null);
  const [height, setHeight] = useState(420);
  const frame = useRef<HTMLIFrameElement>(null);

  const open = useCallback((target?: string) => {
    setHeight(420);
    setNext(safeNext(target ?? here()));
  }, []);

  // Plain links to sign-in (header, prompts) open the dialog.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const link = event.target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') {
        return;
      }
      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        !(url.pathname === '/earn/signin' || url.pathname === SIGN_IN_PATH)
      ) {
        return;
      }
      event.preventDefault();
      open(url.searchParams.get('next') ?? undefined);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  // What the framed sign-in page says.
  useEffect(() => {
    if (next === null) return undefined;
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !isRecord(event.data)
      ) {
        return;
      }
      const data = event.data;
      if (data.type === SIGN_IN_HEIGHT && typeof data.height === 'number') {
        setHeight(Math.min(Math.max(data.height, 200), 800));
      } else if (data.type === SIGNED_IN && typeof data.href === 'string') {
        // A full load, so every part of the page knows who they are.
        window.location.assign(safeNext(data.href));
      } else if (data.type === SIGN_IN_GOOGLE) {
        window.location.assign(
          `${SIGN_IN_PATH}?google=1&next=${encodeURIComponent(next)}`,
        );
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [next]);

  return (
    <SignInContext value={open}>
      {children}
      <Dialog
        open={next !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setNext(null);
        }}
      >
        <DialogContent
          className="z-200 w-[23rem] overflow-hidden p-0"
          hideCloseIcon
        >
          <DialogTitle className="sr-only">Sign in</DialogTitle>
          {next !== null && (
            // Earn's own sign-in page, same origin: Privy needs its
            // scripts and cookies there, which no sandbox would leave.
            // oxlint-disable-next-line react/iframe-missing-sandbox
            <iframe
              ref={frame}
              title="Sign in"
              src={`${SIGN_IN_PATH}?embed=1&next=${encodeURIComponent(next)}`}
              className="block w-full border-0"
              style={{ height }}
            />
          )}
        </DialogContent>
      </Dialog>
    </SignInContext>
  );
}
