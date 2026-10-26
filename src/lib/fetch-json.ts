'use client';

import { signInHref } from '@/lib/safe-next';

// Client calls to Earn's own route handlers. Earn's session cookie goes
// along by itself (same origin); there are no tokens to attach.

export class RequestError extends Error {
  constructor(
    readonly status: number,
    // The handler's JSON answer, when it sent one (`{ error }`, `{ errors }`,
    // `{ refusal }`).
    readonly body: unknown,
  ) {
    super(`Request failed: ${status}`);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// What a refused request said, for a toast: the handler's `error` or
// `refusal` when it's a sentence, else `fallback`.
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof RequestError) {
    const body = error.body;
    if (isRecord(body)) {
      for (const key of ['message', 'refusal', 'error'] as const) {
        const value = body[key];
        if (typeof value === 'string' && value.includes(' ')) return value;
      }
    }
  }
  return fallback;
}

async function send<T>(url: string, init: RequestInit): Promise<T> {
  const headers = new Headers({ accept: 'application/json' });
  if (init.body !== undefined) headers.set('content-type', 'application/json');
  const response = await fetch(url, { ...init, headers });
  const body: unknown = await response.json().catch(() => null);
  if (response.status === 401 && init.method !== 'GET') {
    // Signed out meanwhile: off to sign in, back here after.
    window.location.assign(
      signInHref(window.location.pathname + window.location.search),
    );
  }
  if (!response.ok) throw new RequestError(response.status, body);
  // Earn's own handler answered; its shape is the handler's contract.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return body as T;
}

export const getJson = <T>(url: string, signal?: AbortSignal) =>
  send<T>(url, { method: 'GET', signal });

export const postJson = <T>(url: string, body?: unknown) =>
  send<T>(url, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const deleteJson = <T>(url: string, body?: unknown) =>
  send<T>(url, {
    method: 'DELETE',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
