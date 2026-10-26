# Superteam Earn

Earn on Skyhook's architecture: App Router, server-side data, Effect
services, Privy only at the edges. MySQL (PlanetScale) is shared with
earncognito, earn-emails, earn-agent and os; see ../AGENTS.md for the
cross-repo contracts.

## Tooling

- pnpm only. `pnpm check` runs oxlint (type-aware, with Effect's rules),
  oxfmt, tsc, knip and the vitest suite; it must pass. Knip fails on unused
  files, exports and dependencies: delete them rather than ignore them.
- Oxlint runs Effect's own rules through `@effect/tsgo` (the recommended
  preset), including `floating-effect`: an Effect that is created but never
  yielded does nothing, and tsc can't see it. `pnpm install` patches oxlint
  for this (the `prepare` script); TypeScript itself stays unpatched.
  Unstable Effect APIs are refused unless listed in `allowedUnstableApis` in
  `tsconfig.json` (now `@effect/vitest`); add to it only deliberately.
- `prisma/schema.prisma` is shared with the other services. Never change it
  as part of app work.

## Routing

- App Router only (`src/app`). URLs stay Earn's: everything under `/earn/…`
  with trailing slashes (`trailingSlash: true`); the superteam.fun pages at
  the root. Write links and fetch URLs with the trailing slash.
- A page is a server component that loads its data through services and
  hands it to client components as props. `generateMetadata`/`metadata`
  replace `next/head`; `notFound()`/`redirect()` replace
  `getServerSideProps` returns.
- Client components use `next/navigation`, never `next/router`.

## Auth

- The server trusts only `getSession()` (`src/lib/session.ts`): Earn's own
  signed session cookie, issued by `POST /earn/session/` from Privy's
  `privy-token` (verified locally with the public verification key), or that
  token until one is issued. Never trust client-sent user ids, emails or
  `privy-session`, which is only a hint.
- Privy's SDK loads only under `src/app/(privy)/` (`/earn/signin/` and
  `/earn/wallet/`); a lint rule enforces it. Links between
  public and Privy pages are plain `<a>` (full page loads), never
  `next/link`: each side has its own CSP (`src/proxy.ts`), and a CSP belongs
  to a document. Signed-out visitors go to `signInHref(next)`
  (`src/lib/safe-next.ts`); `AuthWrapper` does it for buttons.
- KYC (Sumsub) pages are their own documents too: `/earn/kyc/…` and
  `/earn/grants/[slug]/kyc/`.
- Client components read the signed-in account with `useViewer()`
  (`src/lib/viewer.tsx`), loaded once per request by the root layout. After a
  write that changes it, `router.refresh()`.

## Data fetching

- Pages and layouts load data on the server, through services, on
  `runtime`. No react-query, axios or client stores for server data.
- Writes go to route handlers, called with `postJson`/`getJson`
  (`src/lib/fetch-json.ts`), then `router.refresh()` (or local state) shows
  the result. Interactive reads that can't be on the page (typeahead search,
  "load more") are GET route handlers too.
- Anything that writes must use `guardUser`/`guardSponsor`
  (`src/lib/route-guard.ts`): `Origin` must be one of
  `AppConfig.siteOrigins`, the session valid, the Earn account not blocked.
  Never act on GET requests.

## Server logic

- Effect v4 services in `src/server/` (rules from
  `docs/internals/effect-services.md` in pingdotgg/t3code): one module per
  service, the tag named after the service (`earn/<Name>`), `make` then
  `layer`, dependencies from the environment, `Schema.TaggedError`s whose
  messages never quote `cause`. Import modules as namespaces
  (`import * as Effect from 'effect/Effect'`,
  `import * as Users from '@/server/users'`).
- Every query goes through `Database.query(operation, run)`; transactions
  through `client.$transaction` inside one `query`.
- Shared services (`src/server/runtime.ts` `shared`): AppConfig, Database,
  Sessions, Users, Credits, Queues (logicQueue), Locks, RateLimits,
  Earncognito. Each product area merges its services in
  `src/server/areas/<area>.ts`; an area depends on the shared services and its
  own, never on another area's.
- Config is read once, in `AppConfig`; nothing else on the server reads
  `process.env` except `proxy.ts`. Client code reads `NEXT_PUBLIC_*` through
  `src/lib/public-env.ts`.
- Effects run only at the Next boundary, on `runtime`
  (`src/server/runtime.ts`): pages, layouts and route handlers. A route
  handler reads the request, calls one service method and maps its typed
  errors to a response. Pure helpers and client components stay plain
  TypeScript.
- Queue payloads (`logicQueue`) and earncognito paths are contracts with
  other repos: keep their shapes.
- Test through the services with `@effect/vitest`, replacing only external
  dependencies (database client, HTTP, config); see `src/server/*.test.ts`.

## UI

- Earn's look stays: shadcn/ui on Radix in `src/components/ui`, Tailwind v4,
  `src/styles`. Mobile-first: check ~390px before calling UI work done.
