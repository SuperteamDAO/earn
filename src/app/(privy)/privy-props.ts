import 'server-only';

import { headers } from 'next/headers';

import * as AppConfig from '@/server/app-config';
import { runtime } from '@/server/runtime';

import { type PrivyProps } from './privy-auth-provider';

// What a Privy page hands the provider it mounts where Privy is used.
export async function privyProps(): Promise<PrivyProps> {
  const [list, config] = await Promise.all([
    headers(),
    runtime.runPromise(AppConfig.AppConfig),
  ]);
  return {
    appId: config.privy.appId,
    clientId: config.privy.clientId,
    nonce: list.get('x-nonce') ?? undefined,
  };
}
