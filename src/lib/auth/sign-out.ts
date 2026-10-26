import { signingOut } from './session-renewal';
import { SIGNED_OUT, SIGN_OUT, SIGN_OUT_READY } from './sign-out-messages';

// Public pages don't load Privy's SDK, so they ask /earn/signin to sign out, in a
// hidden frame, as session renewal does (see session-renewal.ts). True once
// the session has ended; false if it didn't finish in time.

const LIMIT_MS = 15_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function signOut(): Promise<boolean> {
  return signingOut(inFrame);
}

function inFrame(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const frame = document.createElement('iframe');
    frame.src = '/earn/signin/?sign-out=1';
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');

    const finish = (ok: boolean) => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      frame.remove();
      resolve(ok);
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.contentWindow
      ) {
        return;
      }
      const data: unknown = event.data;
      if (!isRecord(data)) return;
      if (data.type === SIGN_OUT_READY) {
        frame.contentWindow?.postMessage(
          { type: SIGN_OUT },
          window.location.origin,
        );
      } else if (data.type === SIGNED_OUT) {
        finish(data.ok === true);
      }
    };
    const timer = setTimeout(() => finish(false), LIMIT_MS);
    window.addEventListener('message', onMessage);
    document.body.append(frame);
  });
}
