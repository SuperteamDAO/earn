'use client';

import { RequestError } from '@/lib/fetch-json';

// A PUT to one of Earn's own route handlers (marking an application
// completed is Earn's only one), answered as postJson answers.
export async function putJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new RequestError(response.status, data);
  // The handler's answer; its shape is the handler's contract.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return data as T;
}
