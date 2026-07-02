# Avalanche Earn Migration Notes

## Current status

- `/earn` is now a standalone Avalanche Earn landing page.
- Supabase CLI config exists under `supabase/`.
- The intended Supabase project ref is `elqxthqtpwztnrixeyun`.
- The existing application database layer is still Prisma with a MySQL schema.

## Supabase link

Use the CLI from the project root:

```bash
supabase login
supabase link --project-ref elqxthqtpwztnrixeyun
```

If prompted, enter the remote database password from the Supabase dashboard.
The project URL is:

```text
https://elqxthqtpwztnrixeyun.supabase.co
```

## Remaining Avalanche port work

The upstream codebase is Solana-first. A production Avalanche migration needs a
separate wallet and payout pass across:

- `src/components/providers.tsx`
- `src/context/SolanaWallet.tsx`
- `src/app/api/wallet/create-signed-transaction/route.ts`
- `src/features/wallet/components/withdraw/WithdrawFundsFlow.tsx`
- `src/features/wallet/utils/getConnection.ts`
- `src/features/wallet/utils/fetchUserTokens.ts`
- `src/app/api/wallet/price/route.ts`
- `src/features/sponsor-dashboard/components/Submissions/PayoutButton.tsx`
- `src/server/tokenList.ts`
- `src/constants/tokenList.ts`
- `prisma/schema.prisma`
- `next.config.ts`
- `.env.example`

The Prisma schema currently uses `provider = "mysql"`, `relationMode =
"prisma"`, and MySQL-specific column annotations such as `@db.LongText`. Those
must be converted before `DATABASE_URL` can point at Supabase Postgres.
