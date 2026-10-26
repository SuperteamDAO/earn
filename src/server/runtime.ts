import 'server-only';

import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import * as AppConfig from '@/server/app-config';
import * as Builder from '@/server/areas/builder';
import * as Dashboard from '@/server/areas/dashboard';
import * as Grants from '@/server/areas/grants';
import * as Home from '@/server/areas/home';
import * as Listings from '@/server/areas/listings';
import * as Review from '@/server/areas/review';
import * as Site from '@/server/areas/site';
import * as Sponsors from '@/server/areas/sponsors';
import * as Talent from '@/server/areas/talent';
import * as Wallet from '@/server/areas/wallet';
import * as Credits from '@/server/credits';
import * as Database from '@/server/database';
import * as Earncognito from '@/server/earncognito';
import * as EmailCheck from '@/server/email-check';
import * as Locks from '@/server/locks';
import * as Queues from '@/server/queues';
import * as RateLimits from '@/server/rate-limits';
import * as Sessions from '@/server/sessions';
import * as Users from '@/server/users';

// What every area may use.
const shared = Layer.mergeAll(
  Sessions.layer,
  Users.layer,
  Credits.layer,
  Queues.layer,
  Locks.layer,
  RateLimits.layer,
  Earncognito.layer,
  // Sign-in's address check, before Privy sends a code.
  EmailCheck.layer.pipe(Layer.provide(RateLimits.layer)),
).pipe(Layer.provideMerge(Database.layer), Layer.provideMerge(AppConfig.layer));

const appLayer = Layer.mergeAll(
  Home.layer,
  Listings.layer,
  Grants.layer,
  Dashboard.layer,
  Review.layer,
  Builder.layer,
  Talent.layer,
  Sponsors.layer,
  Wallet.layer,
  Site.layer,
).pipe(Layer.provideMerge(shared));

// Built once per server process. `next dev` can keep an instance built from
// an older version of a service after its file changes; restart the dev
// server after changing what a service offers.
export const runtime = ManagedRuntime.make(appLayer);
